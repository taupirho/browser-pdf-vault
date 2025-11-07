import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
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
    logStep("Webhook received");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const signature = req.headers.get("stripe-signature");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!signature || !webhookSecret) {
      throw new Error("Missing signature or webhook secret");
    }

    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    logStep("Event type", { type: event.type });

    // Handle checkout.session.completed for both subscriptions and one-time payments
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      logStep("Checkout session completed", {
        sessionId: session.id,
        mode: session.mode,
        customerId: session.customer,
        metadata: session.metadata
      });

      const userId = session.metadata?.user_id;
      const plan = session.metadata?.plan;

      if (!userId || !plan) {
        logStep("Missing metadata", { userId, plan });
        return new Response(JSON.stringify({ error: "Missing user_id or plan in metadata" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      // Handle one-time payment for LTD
      if (session.mode === "payment" && plan === "ltd") {
        logStep("Processing LTD one-time payment", { userId, plan });

        const { data: profile, error: profileError } = await supabaseClient
          .from("profiles")
          .select("email, subscription_tier")
          .eq("user_id", userId)
          .single();

        if (profileError) {
          logStep("Error fetching profile", { error: profileError });
          throw profileError;
        }

        const previousTier = profile?.subscription_tier || "free";

        // Update profile to LTD tier
        const { error: updateError } = await supabaseClient
          .from("profiles")
          .update({
            subscription_tier: "ltd",
            max_daily_files: 50,
            max_file_size_kb: 10240, // 10MB
            subscribed: true,
            stripe_customer_id: session.customer as string,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);

        if (updateError) {
          logStep("Error updating profile", { error: updateError });
          throw updateError;
        }

        logStep("Profile updated to LTD", { userId, previousTier });

        // Send confirmation email
        if (profile?.email) {
          try {
            await supabaseClient.functions.invoke("send-subscription-email", {
              body: {
                type: "activated",
                email: profile.email,
                previous_tier: previousTier,
                new_tier: "ltd",
                subscription_end: null, // One-time payment, no end date
              },
            });
            logStep("Confirmation email sent", { email: profile.email });
          } catch (emailError) {
            logStep("Failed to send email", { error: emailError });
          }
        }

        return new Response(JSON.stringify({ success: true, tier: "ltd" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // Handle subscription payments (starter, pro)
      if (session.mode === "subscription") {
        logStep("Processing subscription", { userId, plan });

        const { data: profile, error: profileError } = await supabaseClient
          .from("profiles")
          .select("email, subscription_tier")
          .eq("user_id", userId)
          .single();

        if (profileError) {
          logStep("Error fetching profile", { error: profileError });
          throw profileError;
        }

        const previousTier = profile?.subscription_tier || "free";

        let maxDailyFiles = 2;
        let maxFileSizeKb = 250;

        if (plan === "starter") {
          maxDailyFiles = 10;
          maxFileSizeKb = 1024; // 1MB
        } else if (plan === "pro") {
          maxDailyFiles = 50;
          maxFileSizeKb = 10240; // 10MB
        }

        // Update profile
        const { error: updateError } = await supabaseClient
          .from("profiles")
          .update({
            subscription_tier: plan,
            max_daily_files: maxDailyFiles,
            max_file_size_kb: maxFileSizeKb,
            subscribed: true,
            stripe_customer_id: session.customer as string,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);

        if (updateError) {
          logStep("Error updating profile", { error: updateError });
          throw updateError;
        }

        logStep("Profile updated", { userId, plan, previousTier });

        // Send confirmation email
        if (profile?.email) {
          try {
            const emailType = previousTier === "free" ? "activated" : 
                             plan > previousTier ? "upgrade" : "downgrade";
                             
            await supabaseClient.functions.invoke("send-subscription-email", {
              body: {
                type: emailType,
                email: profile.email,
                previous_tier: previousTier,
                new_tier: plan,
              },
            });
            logStep("Confirmation email sent", { email: profile.email, type: emailType });
          } catch (emailError) {
            logStep("Failed to send email", { error: emailError });
          }
        }

        return new Response(JSON.stringify({ success: true, tier: plan }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    }

    // Handle subscription cancellation
    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      logStep("Subscription deleted", { customerId, subscriptionId: subscription.id });

      // Find user by stripe_customer_id
      const { data: profile, error: profileError } = await supabaseClient
        .from("profiles")
        .select("user_id, email, subscription_tier")
        .eq("stripe_customer_id", customerId)
        .single();

      if (profileError || !profile) {
        logStep("Could not find profile for customer", { customerId });
        return new Response(JSON.stringify({ error: "Profile not found" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        });
      }

      const previousTier = profile.subscription_tier || "free";

      // Don't downgrade LTD users (they have lifetime access)
      if (previousTier === "ltd") {
        logStep("Skipping downgrade for LTD user", { userId: profile.user_id });
        return new Response(JSON.stringify({ success: true, message: "LTD user kept" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // Downgrade to free tier
      const { error: updateError } = await supabaseClient
        .from("profiles")
        .update({
          subscription_tier: "free",
          max_daily_files: 2,
          max_file_size_kb: 250,
          subscribed: false,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", profile.user_id);

      if (updateError) {
        logStep("Error updating profile", { error: updateError });
        throw updateError;
      }

      logStep("Profile downgraded to free", { userId: profile.user_id, previousTier });

      // Send cancellation email
      if (profile.email) {
        try {
          await supabaseClient.functions.invoke("send-subscription-email", {
            body: {
              type: "cancellation",
              email: profile.email,
              previous_tier: previousTier,
              new_tier: "free",
            },
          });
          logStep("Cancellation email sent", { email: profile.email });
        } catch (emailError) {
          logStep("Failed to send email", { error: emailError });
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in webhook", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
