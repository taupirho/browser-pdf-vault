import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PROCESS-REFERRAL-REWARD] ${step}${detailsStr}`);
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
    const { referred_user_id } = await req.json();
    if (!referred_user_id) {
      throw new Error("Missing referred_user_id");
    }

    logStep("Processing referral reward", { referred_user_id });

    // Find the pending referral for this user
    const { data: referral, error: referralError } = await supabaseClient
      .from("referrals")
      .select("*")
      .eq("referred_id", referred_user_id)
      .eq("status", "pending")
      .single();

    if (referralError || !referral) {
      logStep("No pending referral found", { referred_user_id });
      return new Response(JSON.stringify({ message: "No pending referral found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep("Found referral", { referralId: referral.id, referrerId: referral.referrer_id });

    // Update referral status to converted
    const { error: updateRefError } = await supabaseClient
      .from("referrals")
      .update({
        status: "converted",
        converted_at: new Date().toISOString(),
        reward_granted: true,
      })
      .eq("id", referral.id);

    if (updateRefError) {
      logStep("Error updating referral", { error: updateRefError });
      throw updateRefError;
    }

    // Grant bonus daily files to the referrer (e.g., +2 files/day for 30 days)
    const bonusExpiry = new Date();
    bonusExpiry.setDate(bonusExpiry.getDate() + 30);

    const { data: referrerProfile } = await supabaseClient
      .from("profiles")
      .select("bonus_daily_files")
      .eq("user_id", referral.referrer_id)
      .single();

    const currentBonus = referrerProfile?.bonus_daily_files || 0;

    const { error: updateProfileError } = await supabaseClient
      .from("profiles")
      .update({
        bonus_daily_files: currentBonus + 2,
        bonus_expires_at: bonusExpiry.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", referral.referrer_id);

    if (updateProfileError) {
      logStep("Error updating referrer profile", { error: updateProfileError });
      throw updateProfileError;
    }

    logStep("Referral reward granted", {
      referrerId: referral.referrer_id,
      newBonus: currentBonus + 2,
      expiresAt: bonusExpiry.toISOString(),
    });

    // Send referral reward email
    try {
      await supabaseClient.functions.invoke("send-referral-email", {
        body: {
          referrer_id: referral.referrer_id,
          type: "reward_granted",
        },
      });
    } catch (emailError) {
      logStep("Failed to send referral email", { error: emailError });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
