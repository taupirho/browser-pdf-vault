import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[SEND-REFERRAL-EMAIL] ${step}${detailsStr}`);
};

interface Payload {
  email: string;
  bonus_files: number;
  bonus_days: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: Payload = await req.json();
    const { email, bonus_files, bonus_days } = body;

    if (!email || !bonus_files || !bonus_days) {
      throw new Error("Missing required fields: email, bonus_files, bonus_days");
    }

    // Validate email exists in profiles
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("email")
      .eq("email", email)
      .single();

    if (profileError || !profile) {
      logStep("Email not found in profiles", { email: email.substring(0, 20) + "..." });
      return new Response(JSON.stringify({ error: "Invalid recipient" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const html = `
      <div style="font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial, sans-serif; line-height:1.6; max-width:600px; margin:0 auto;">
        <div style="background:#1a1a2e; padding:20px; text-align:center; border-radius:8px 8px 0 0;">
          <h1 style="color:#fff; margin:0; font-size:24px;">🎉 Referral Reward Earned!</h1>
          <p style="color:#a0a0a0; margin:8px 0 0; font-size:14px;">Thank you for spreading the word about SecurePDF</p>
        </div>
        <div style="padding:24px; background:#ffffff; border:1px solid #eee; border-top:none; border-radius:0 0 8px 8px;">
          <h2 style="margin:0 0 16px; color:#1a1a2e;">You've earned bonus file protections!</h2>
          <p style="color:#333;">Great news! Someone you referred just upgraded to a paid plan.</p>
          <div style="background:#f0f9ff; padding:16px; border-radius:8px; text-align:center; margin:20px 0;">
            <p style="margin:0; font-size:24px; font-weight:bold; color:#1a1a2e;">+${bonus_files} files/day</p>
            <p style="margin:8px 0 0; color:#666;">for the next ${bonus_days} days</p>
          </div>
          <p style="color:#333;">Your bonus has been automatically added to your account. Keep sharing your referral link to earn more rewards!</p>
          <div style="text-align:center; margin:24px 0;">
            <a href="https://securepdf.io/account" style="display:inline-block; background:#1a1a2e; color:#fff; padding:14px 28px; border-radius:6px; text-decoration:none; font-weight:600;">View Your Account</a>
          </div>
          <hr style="border:none;border-top:1px solid #eee;margin:20px 0;" />
          <p style="color:#666; font-size:14px;">If you have any questions, contact us at info@securepdf.io</p>
          <p style="color:#999; font-size:12px; margin-top:20px;">SecurePDF - PDF Password Protection Tool</p>
        </div>
      </div>
    `;

    logStep("Sending referral reward email", { to: email.substring(0, 20) + "..." });

    const { error } = await resend.emails.send({
      from: "SecurePDF <no-reply@notifications.securepdf.io>",
      to: [email],
      subject: "🎉 Your referral reward is here! +10 bonus file protections",
      html,
      replyTo: ["info@securepdf.io"],
    });

    if (error) throw error;

    logStep("Email sent successfully");

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    logStep("ERROR", { message: error?.message ?? String(error) });
    return new Response(JSON.stringify({ error: error?.message ?? String(error) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
