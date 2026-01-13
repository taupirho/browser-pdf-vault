import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
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

    const { plan } = await req.json();
    if (!plan || !["starter", "pro", "ltd"].includes(plan)) {
      throw new Error("Invalid plan specified");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    
    logStep("User authenticated", { userId: user.id, email: user.email, plan });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Validate origin against allowlist to prevent open redirect attacks
    const allowedOrigins = [
      "https://securepdfprotector.com",
      "https://www.securepdfprotector.com",
      "https://preview--securepdf-password-protector.lovable.app",
      Deno.env.get("ALLOWED_ORIGIN") // Allow configurable origin via secret
    ].filter(Boolean);
    
    const requestOrigin = req.headers.get("origin");
    const safeOrigin = allowedOrigins.includes(requestOrigin || "") 
      ? requestOrigin 
      : allowedOrigins[0] || "https://securepdfprotector.com";

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
if (customers.data.length > 0) {
  customerId = customers.data[0].id;
  logStep("Found existing customer", { customerId });

  // If customer already has an active subscription, redirect to Customer Portal instead of creating a new one
  const activeSubs = await stripe.subscriptions.list({ customer: customerId, status: "active", limit: 1 });
  if (activeSubs.data.length > 0) {
    logStep("Active subscription exists - redirecting to portal", { subscriptionId: activeSubs.data[0].id });
    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${safeOrigin}/pricing`,
    });
    return new Response(JSON.stringify({ url: portal.url, type: "portal" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
}

    // Define pricing based on plan
    const planConfig = {
      starter: {
        price: 699, // $6.99
        name: "Starter Plan",
        tier: "starter"
      },
      pro: {
        price: 1599, // $15.99
        name: "Pro Plan", 
        tier: "pro"
      },
      ltd: {
        price: 12000, // $120.00
        name: "Lifetime Deal",
        tier: "ltd"
      }
    };

    const selectedPlan = planConfig[plan as keyof typeof planConfig];
    const isLTD = plan === "ltd";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { 
              name: selectedPlan.name,
              description: isLTD 
                ? `${selectedPlan.name} - One-time payment for lifetime access` 
                : `${selectedPlan.name} subscription for PDF protection service`
            },
            unit_amount: selectedPlan.price,
            ...(isLTD ? {} : { recurring: { interval: "month" } }),
          },
          quantity: 1,
        },
      ],
      mode: isLTD ? "payment" : "subscription",
      success_url: `${safeOrigin}/pricing?success=true&plan=${plan}`,
      cancel_url: `${safeOrigin}/pricing?canceled=true`,
      allow_promotion_codes: true,
      metadata: {
        user_id: user.id,
        plan: selectedPlan.tier
      }
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});