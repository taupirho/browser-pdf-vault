import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[SEND-SUBSCRIPTION-EMAIL] ${step}${detailsStr}`);
};

interface Payload {
  type: "activated" | "upgrade" | "downgrade" | "cancellation" | "change" | "payment_failed";
  email: string;
  previous_tier?: string | null;
  new_tier?: string | null;
  subscription_end?: string | null;
}

// Input validation limits
const MAX_EMAIL = 255;
const MAX_TIER = 50;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: Payload = await req.json();
    const { type, email, previous_tier, new_tier, subscription_end } = body;

    if (!email || !type) {
      throw new Error("Missing required fields: email, type");
    }

    // Input length validation
    if (email.length > MAX_EMAIL ||
      (previous_tier && previous_tier.length > MAX_TIER) ||
      (new_tier && new_tier.length > MAX_TIER)) {
      return new Response(JSON.stringify({ error: "Input exceeds maximum length" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Validate email exists in profiles table to prevent abuse
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
      logStep("Email not found in profiles, rejecting request", { email: email.substring(0, 20) + "..." });
      return new Response(JSON.stringify({ error: "Invalid recipient" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    logStep("Email verified in profiles", { email: email.substring(0, 20) + "..." });

    const from = "SecurePDF <info@securepdf.io>";

    let subject = "SecurePDF - Your subscription has changed";
    switch (type) {
      case "activated":
        subject = "SecurePDF - Your subscription is active";
        break;
      case "upgrade":
        subject = "SecurePDF - You have upgraded your plan";
        break;
      case "downgrade":
        subject = "SecurePDF - You have downgraded your plan";
        break;
      case "cancellation":
        subject = "SecurePDF - Your subscription has been canceled";
        break;
      case "change":
        subject = "SecurePDF - Your plan change is scheduled";
        break;
      case "payment_failed":
        subject = "SecurePDF - Payment failed - Action required";
        break;
      default:
        subject = "SecurePDF - Your subscription has changed";
    }

    // Escape HTML in user-provided data
    const escapeTier = (tier: string | null | undefined) =>
      (tier ?? "unknown").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const tierLine = `Plan: ${escapeTier(previous_tier)} → ${escapeTier(new_tier)}`;
    const endLine = subscription_end ? `Current period ends: ${new Date(subscription_end).toUTCString()}` : "";

    let impactNote = "";
    if (type === "downgrade") {
      if (previous_tier === "pro" || previous_tier === "ltd") {
        impactNote =
          "Note: As part of downgrading from Pro/Life Time Deal, any custom password settings are reset. You can continue using the default secure password generator.";
      }
    } else if (type === "cancellation") {
      impactNote =
        "Note: Your SecurePDF account has reverted to the Free tier; Pro-only features are no longer available.";
    } else if (type === "change") {
      impactNote =
        "This plan change is scheduled and will take effect at the end of your current billing period.";
    } else if (type === "payment_failed") {
      impactNote =
        "Your recent payment for SecurePDF was unsuccessful. Your account has been temporarily downgraded to the Free tier. Please update your payment method to restore your subscription. If you believe this is an error, please contact your bank or reply to this email for assistance.";
    }

    // Add billing portal button for payment failed emails
    const billingButton = type === "payment_failed" ? `
      <div style="text-align:center; margin:24px 0;">
        <a href="https://securepdf.io/auth?redirect=billing" style="display:inline-block; background:#1a1a2e; color:#fff; padding:14px 28px; border-radius:6px; text-decoration:none; font-weight:600;">Update Payment Method</a>
      </div>
    ` : "";

    const html = `
      <div style="font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial, sans-serif; line-height:1.6; max-width:600px; margin:0 auto;">
        <div style="background:#1a1a2e; padding:20px; text-align:center; border-radius:8px 8px 0 0;">
          <h1 style="color:#fff; margin:0; font-size:24px;">🔒 SecurePDF</h1>
          <p style="color:#a0a0a0; margin:8px 0 0; font-size:14px;">Protect your PDFs with confidence</p>
        </div>
        <div style="padding:24px; background:#ffffff; border:1px solid #eee; border-top:none; border-radius:0 0 8px 8px;">
          <h2 style="margin:0 0 16px; color:#1a1a2e;">${subject.replace("SecurePDF - ", "")}</h2>
          <p style="color:#333;">${tierLine}</p>
          ${endLine ? `<p style="color:#333;">${endLine}</p>` : ""}
          ${impactNote ? `<p style="background:#f8f9fa; padding:12px; border-radius:6px; border-left:4px solid #1a1a2e;"><strong>${impactNote}</strong></p>` : ""}
          ${billingButton}
          <hr style="border:none;border-top:1px solid #eee;margin:20px 0;" />
          <p style="color:#666; font-size:14px;">If you did not expect this change or need assistance, please contact us by replying to this email or visiting <a href="https://securepdf.io" style="color:#1a1a2e;">securepdf.io</a>.</p>
          <p style="color:#999; font-size:12px; margin-top:20px;">SecurePDF - PDF Password Protection Tool</p>
        </div>
      </div>
    `;

    logStep("Sending email", { to: email.substring(0, 20) + "...", type, previous_tier, new_tier });

    const { error } = await resend.emails.send({
      from,
      to: [email],
      subject,
      html,
      replyTo: ["info@securepdf.io"],
    });

    if (error) throw error;

    logStep("Email sent successfully", { to: email.substring(0, 20) + "..." });

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    logStep("ERROR in send-subscription-email", { message: error?.message ?? String(error) });
    return new Response(JSON.stringify({ error: error?.message ?? String(error) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
