import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-REFERRAL-EMAIL] ${step}${detailsStr}`);
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
    const { referrer_id, type } = await req.json();
    if (!referrer_id || !type) {
      throw new Error("Missing referrer_id or type");
    }

    logStep("Sending referral email", { referrer_id, type });

    // Get referrer's email
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("email, referral_code, bonus_daily_files")
      .eq("user_id", referrer_id)
      .single();

    if (profileError || !profile) {
      throw new Error("Could not find referrer profile");
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    let subject = "";
    let htmlContent = "";

    if (type === "reward_granted") {
      subject = "🎉 You earned bonus files from your referral!";
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a1a1a;">Referral Reward Earned! 🎉</h2>
          <p>Great news! Someone you referred has signed up for SecurePDF.</p>
          <p>You've earned <strong>+2 bonus daily files</strong> for the next 30 days!</p>
          <p>Your current bonus: <strong>${profile.bonus_daily_files} extra files/day</strong></p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #666; font-size: 14px;">
            Keep sharing your referral link to earn more bonuses:<br/>
            <a href="https://securepdf.io/?ref=${profile.referral_code}">
              https://securepdf.io/?ref=${profile.referral_code}
            </a>
          </p>
        </div>
      `;
    }

    if (!subject) {
      logStep("Unknown email type", { type });
      return new Response(JSON.stringify({ message: "Unknown email type" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "SecurePDF <noreply@securepdfprotector.com>",
        to: [profile.email],
        subject,
        html: htmlContent,
      }),
    });

    if (!emailRes.ok) {
      const errorText = await emailRes.text();
      logStep("Resend API error", { status: emailRes.status, error: errorText });
      throw new Error(`Email send failed: ${errorText}`);
    }

    logStep("Email sent successfully", { email: profile.email, type });

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
