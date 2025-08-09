import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

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
  type: "activated" | "upgrade" | "downgrade" | "cancellation" | "change";
  email: string;
  previous_tier?: string | null;
  new_tier?: string | null;
  subscription_end?: string | null;
}

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

    const from = "Lovable App <onboarding@resend.dev>";

    let subject = "Your subscription has changed";
    switch (type) {
      case "activated":
        subject = "Your subscription is active";
        break;
      case "upgrade":
        subject = "You've upgraded your plan";
        break;
      case "downgrade":
        subject = "You've downgraded your plan";
        break;
      case "cancellation":
        subject = "Your subscription has been canceled";
        break;
      default:
        subject = "Your subscription has changed";
    }

    const tierLine = `Plan: ${previous_tier ?? "unknown"} → ${new_tier ?? "unknown"}`;
    const endLine = subscription_end ? `Current period ends: ${new Date(subscription_end).toUTCString()}` : "";

    let impactNote = "";
    if (type === "downgrade") {
      impactNote =
        "Note: As part of downgrading from Pro, any custom password settings are reset. You can continue using the default secure password generator.";
    } else if (type === "cancellation") {
      impactNote =
        "Note: Your account has reverted to the Free tier; Pro-only features are no longer available.";
    }

    const html = `
      <div style="font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial, \"Apple Color Emoji\", \"Segoe UI Emoji\"; line-height:1.6;">
        <h2 style="margin:0 0 12px;">${subject}</h2>
        <p>${tierLine}</p>
        ${endLine ? `<p>${endLine}</p>` : ""}
        ${impactNote ? `<p><strong>${impactNote}</strong></p>` : ""}
        <hr style="border:none;border-top:1px solid #eee;margin:16px 0;" />
        <p>If you didn’t expect this change, please contact support by replying to this email.</p>
      </div>
    `;

    logStep("Sending email", { to: email, type, previous_tier, new_tier });

    const { error } = await resend.emails.send({
      from,
      to: [email],
      subject,
      html,
    });

    if (error) throw error;

    logStep("Email sent successfully", { to: email });

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
