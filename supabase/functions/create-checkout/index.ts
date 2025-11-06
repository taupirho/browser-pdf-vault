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

    // Ensure a 100% off promo code exists for general testing (PRO100)
    const TEST_PROMO_CODE = "PRO100";
    try {
      const existingPromo = await stripe.promotionCodes.list({ code: TEST_PROMO_CODE, active: true, limit: 1 });
      if (existingPromo.data.length === 0) {
        logStep("Creating 100% off coupon and promo code", { code: TEST_PROMO_CODE });
        const coupon = await stripe.coupons.create({
          percent_off: 100,
          duration: "once", // first invoice free
        });
        await stripe.promotionCodes.create({
          coupon: coupon.id,
          code: TEST_PROMO_CODE,
          active: true,
        });
        logStep("Promo code created", { code: TEST_PROMO_CODE, couponId: coupon.id });
      } else {
        logStep("Promo code already exists", { code: TEST_PROMO_CODE, promoId: existingPromo.data[0].id });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      logStep("Failed ensuring promo code (non-fatal)", { message: msg });
    }

    // Ensure a 100% off STARTER-only promo code (STARTER100)
    let starterPromoId: string | undefined;
    try {
      const STARTER_PROMO_CODE = "STARTER100";
      const existingStarter = await stripe.promotionCodes.list({ code: STARTER_PROMO_CODE, active: true, limit: 1 });
      if (existingStarter.data.length === 0) {
        logStep("Creating STARTER100 100% off coupon and promo code", { code: STARTER_PROMO_CODE });
        const couponStarter = await stripe.coupons.create({
          percent_off: 100,
          duration: "once", // first invoice free for Starter
        });
        const starterPromo = await stripe.promotionCodes.create({
          coupon: couponStarter.id,
          code: STARTER_PROMO_CODE,
          active: true,
        });
        starterPromoId = starterPromo.id;
        logStep("STARTER100 promo code created", { code: STARTER_PROMO_CODE, couponId: couponStarter.id, promoId: starterPromoId });
      } else {
        starterPromoId = existingStarter.data[0].id;
        logStep("STARTER100 promo code already exists", { promoId: starterPromoId });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      logStep("Failed ensuring STARTER100 promo code (non-fatal)", { message: msg });
    }
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
    const origin = req.headers.get("origin") || "http://localhost:3000";
    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/pricing`,
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
      success_url: `${req.headers.get("origin")}/pricing?success=true&plan=${plan}`,
      cancel_url: `${req.headers.get("origin")}/pricing?canceled=true`,
      allow_promotion_codes: true,
      discounts: plan === "starter" && starterPromoId ? [{ promotion_code: starterPromoId }] : undefined,
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