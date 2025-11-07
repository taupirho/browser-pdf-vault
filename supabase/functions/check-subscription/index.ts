import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Detect if this check was triggered after returning from the Stripe portal
    let portalReturn = false;
    try {
      const body = await req.json();
      portalReturn = Boolean((body as any)?.portalReturn);
    } catch {
      // no body provided
    }

    // Fetch existing profile to detect tier changes
    const { data: existingProfile } = await supabaseClient
      .from("profiles")
      .select("subscription_tier")
      .eq("user_id", user.id)
      .single();

    const previousTier = existingProfile?.subscription_tier || "free";

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, updating to free tier");
      await supabaseClient
        .from("profiles")
        .update({
          subscription_tier: "free",
          max_daily_files: 2,
          max_file_size_kb: 250,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      // If user previously had a paid tier, notify them of cancellation/downgrade
      if (previousTier !== "free") {
        try {
          const { error: fnError } = await supabaseClient.functions.invoke(
            "send-subscription-email",
            {
              body: {
                type: "cancellation",
                email: user.email,
                previous_tier: previousTier,
                new_tier: "free",
                subscription_end: null,
              },
            }
          );
          if (fnError) {
            logStep("send-subscription-email error (no customer path)", {
              message: fnError.message,
            });
          } else {
            logStep("Lifecycle email enqueued (no customer path)", {
              previousTier,
              newTier: "free",
            });
          }
        } catch (e) {
          logStep("Failed to invoke send-subscription-email (no customer)", {
            message: e instanceof Error ? e.message : String(e),
          });
        }
      }

      return new Response(
        JSON.stringify({
          subscribed: false,
          subscription_tier: "free",
          max_daily_files: 2,
          max_file_size_kb: 250,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Check if user already has LTD tier (one-time payment, not a subscription)
    const { data: currentProfile } = await supabaseClient
      .from("profiles")
      .select("subscription_tier")
      .eq("user_id", user.id)
      .single();

    const isLTDUser = currentProfile?.subscription_tier === "ltd";

    // If user has LTD, preserve it (they have lifetime access)
    if (isLTDUser) {
      logStep("User has LTD tier - preserving lifetime access");
      
      await supabaseClient
        .from("profiles")
        .update({
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      return new Response(
        JSON.stringify({
          subscribed: true,
          subscription_tier: "ltd",
          max_daily_files: 50,
          max_file_size_kb: 10240,
          subscription_end: null,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    const hasActiveSub = subscriptions.data.length > 0;
    let subscriptionTier = "free";
    let maxDailyFiles = 2;
    let maxFileSizeKb = 250;
    let subscriptionEnd: string | null = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      
      // Determine subscription tier from price
      const priceId = subscription.items.data[0].price.id;
      const price = await stripe.prices.retrieve(priceId);
      const amount = price.unit_amount || 0;
      
      if (amount === 699) { // $6.99
        subscriptionTier = "starter";
        maxDailyFiles = 10;
        maxFileSizeKb = 1024; // 1MB
      } else if (amount === 1599) { // $15.99
        subscriptionTier = "pro";
        maxDailyFiles = 50;
        maxFileSizeKb = 10240; // 10MB
      } else if (amount === 12000) { // $120.00
        subscriptionTier = "ltd";
        maxDailyFiles = 50;
        maxFileSizeKb = 10240; // 10MB
      }
      
      logStep("Active subscription found", { 
        subscriptionId: subscription.id, 
        tier: subscriptionTier,
        endDate: subscriptionEnd 
      });

      // Detect any scheduled plan change (e.g., from Stripe Customer Portal at period end)
      try {
        let scheduledNextTier: string | null = null;
        let scheduledEffective: string | null = null;

        if (typeof (subscription as any).schedule === "string") {
          const schedule = await stripe.subscriptionSchedules.retrieve((subscription as any).schedule as string);
          const now = Math.floor(Date.now() / 1000);
          const nextPhase = schedule.phases?.find((p: any) => p.start_date > now);
          if (nextPhase) {
            let nextAmount: number | null = null;
            if (nextPhase.items?.length > 0) {
              const nextItem = nextPhase.items[0];
              if (typeof nextItem.price === "string") {
                const nextPrice = await stripe.prices.retrieve(nextItem.price);
                nextAmount = nextPrice.unit_amount || 0;
              } else if (nextItem.price_data) {
                nextAmount = nextItem.price_data.unit_amount || 0;
              }
            }
            if (nextAmount !== null) {
              if (nextAmount === 699) scheduledNextTier = "starter";
              else if (nextAmount === 1599) scheduledNextTier = "pro";
            }
            scheduledEffective = new Date(nextPhase.start_date * 1000).toISOString();
          }
        }

        if (portalReturn && scheduledNextTier && scheduledNextTier !== subscriptionTier) {
          logStep("Scheduled plan change detected", { from: subscriptionTier, to: scheduledNextTier, effective: scheduledEffective || subscriptionEnd });
          const { error: schedEmailErr } = await supabaseClient.functions.invoke(
            "send-subscription-email",
            {
              body: {
                type: "change",
                email: user.email,
                previous_tier: subscriptionTier,
                new_tier: scheduledNextTier,
                subscription_end: subscriptionEnd,
              },
            }
          );
          if (schedEmailErr) {
            logStep("send-subscription-email error (scheduled change)", { message: schedEmailErr.message });
          } else {
            logStep("Scheduled change email enqueued", { previousTier: subscriptionTier, newTier: scheduledNextTier });
          }
        }
      } catch (err) {
        logStep("Failed to check/send scheduled change email", { message: err instanceof Error ? err.message : String(err) });
      }
    } else {
      logStep("No active subscription found");
    }

    // Update user profile with subscription info
    await supabaseClient.from("profiles").update({
      subscription_tier: subscriptionTier,
      max_daily_files: maxDailyFiles,
      max_file_size_kb: maxFileSizeKb,
      updated_at: new Date().toISOString(),
    }).eq("user_id", user.id);

    logStep("Updated profile with subscription info", { 
      subscribed: hasActiveSub, 
      subscriptionTier,
      maxDailyFiles,
      maxFileSizeKb 
    });

    // Detect tier change and send lifecycle email
    try {
      if (previousTier !== subscriptionTier) {
        let type = "change";
        if (previousTier === "free" && (subscriptionTier === "starter" || subscriptionTier === "pro")) {
          type = "activated";
        } else if (previousTier === "starter" && subscriptionTier === "pro") {
          type = "upgrade";
        } else if (previousTier === "pro" && subscriptionTier === "starter") {
          type = "downgrade";
        } else if (previousTier !== "free" && subscriptionTier === "free") {
          type = "cancellation";
        }

        const { error: fnError } = await supabaseClient.functions.invoke(
          "send-subscription-email",
          {
            body: {
              type,
              email: user.email,
              previous_tier: previousTier,
              new_tier: subscriptionTier,
              subscription_end: subscriptionEnd,
            },
          }
        );

        if (fnError) {
          logStep("send-subscription-email error", { message: fnError.message });
        } else {
          logStep("Lifecycle email enqueued", { previousTier, subscriptionTier, type });
        }
      } else {
        logStep("No tier change detected; no email sent", { tier: subscriptionTier });
      }
    } catch (e) {
      logStep("Failed to invoke send-subscription-email", {
        message: e instanceof Error ? e.message : String(e),
      });
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      subscription_tier: subscriptionTier,
      subscription_end: subscriptionEnd,
      max_daily_files: maxDailyFiles,
      max_file_size_kb: maxFileSizeKb
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});