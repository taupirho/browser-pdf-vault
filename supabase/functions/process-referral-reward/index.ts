import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[PROCESS-REFERRAL-REWARD] ${step}${detailsStr}`);
};

// Referral reward: +10 bonus files per day for 30 days
const BONUS_DAILY_FILES = 10;
const BONUS_DURATION_DAYS = 30;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { referred_user_id } = await req.json();

    if (!referred_user_id) {
      throw new Error("Missing referred_user_id");
    }

    logStep("Processing referral reward", { referred_user_id });

    // Find the referral record for this user
    const { data: referral, error: referralError } = await supabaseClient
      .from("referrals")
      .select("id, referrer_id, referral_code, status, reward_granted")
      .eq("referred_id", referred_user_id)
      .eq("status", "pending")
      .maybeSingle();

    if (referralError) {
      logStep("Error fetching referral", { error: referralError });
      throw referralError;
    }

    if (!referral) {
      logStep("No pending referral found for user", { referred_user_id });
      return new Response(JSON.stringify({ success: false, message: "No pending referral found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (referral.reward_granted) {
      logStep("Reward already granted", { referral_id: referral.id });
      return new Response(JSON.stringify({ success: false, message: "Reward already granted" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep("Found pending referral", { referral_id: referral.id, referrer_id: referral.referrer_id });

    // Calculate bonus expiry date
    const bonusExpiresAt = new Date();
    bonusExpiresAt.setDate(bonusExpiresAt.getDate() + BONUS_DURATION_DAYS);

    // Get current referrer profile to check existing bonus
    const { data: referrerProfile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("bonus_daily_files, bonus_expires_at, email")
      .eq("user_id", referral.referrer_id)
      .single();

    if (profileError) {
      logStep("Error fetching referrer profile", { error: profileError });
      throw profileError;
    }

    // Calculate new bonus (stack if existing bonus hasn't expired)
    let newBonusFiles = BONUS_DAILY_FILES;
    let newBonusExpiry = bonusExpiresAt;

    if (referrerProfile.bonus_expires_at) {
      const existingExpiry = new Date(referrerProfile.bonus_expires_at);
      if (existingExpiry > new Date()) {
        // Stack bonuses and extend expiry
        newBonusFiles = (referrerProfile.bonus_daily_files || 0) + BONUS_DAILY_FILES;
        // Extend expiry by BONUS_DURATION_DAYS from current expiry
        newBonusExpiry = new Date(existingExpiry);
        newBonusExpiry.setDate(newBonusExpiry.getDate() + BONUS_DURATION_DAYS);
      }
    }

    // Update referrer's profile with bonus
    const { error: updateProfileError } = await supabaseClient
      .from("profiles")
      .update({
        bonus_daily_files: newBonusFiles,
        bonus_expires_at: newBonusExpiry.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", referral.referrer_id);

    if (updateProfileError) {
      logStep("Error updating referrer profile", { error: updateProfileError });
      throw updateProfileError;
    }

    logStep("Updated referrer bonus", { 
      referrer_id: referral.referrer_id, 
      bonus_files: newBonusFiles,
      expires_at: newBonusExpiry.toISOString()
    });

    // Mark referral as converted and reward granted
    const { error: updateReferralError } = await supabaseClient
      .from("referrals")
      .update({
        status: "converted",
        reward_granted: true,
        converted_at: new Date().toISOString(),
      })
      .eq("id", referral.id);

    if (updateReferralError) {
      logStep("Error updating referral status", { error: updateReferralError });
      // Don't throw - bonus already granted, just log
    }

    logStep("Referral reward processed successfully", { 
      referral_id: referral.id,
      referrer_id: referral.referrer_id,
      bonus_files: newBonusFiles
    });

    // Send notification email to referrer
    if (referrerProfile.email) {
      try {
        await supabaseClient.functions.invoke("send-referral-email", {
          body: {
            email: referrerProfile.email,
            bonus_files: BONUS_DAILY_FILES,
            bonus_days: BONUS_DURATION_DAYS,
          },
        });
        logStep("Referral reward email sent", { email: referrerProfile.email.substring(0, 20) + "..." });
      } catch (emailError) {
        logStep("Failed to send referral email", { error: emailError });
      }
    }

    return new Response(JSON.stringify({ success: true, bonus_files: newBonusFiles }), {
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
