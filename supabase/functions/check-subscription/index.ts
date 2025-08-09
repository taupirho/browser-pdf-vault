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
      }
      
      logStep("Active subscription found", { 
        subscriptionId: subscription.id, 
        tier: subscriptionTier,
        endDate: subscriptionEnd 
      });
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