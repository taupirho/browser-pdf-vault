import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DsarPayload {
  name?: string;
  email: string;
  requestType: string;
  details?: string;
}

function isValidEmail(email: string) {
  return /[^\s@]+@[^\s@]+\.[^\s@]+/.test(email);
}

const CONTACT_EMAIL = "info@securepdf.io";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = (await req.json()) as DsarPayload;
    if (!payload?.email || !isValidEmail(payload.email)) {
      return new Response(JSON.stringify({ error: "Invalid email" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const createdAt = new Date().toISOString();
    const subject = `DSAR request — ${payload.requestType}`;

    const adminHtml = `
      <h2>New DSAR Request</h2>
      <p><strong>Type:</strong> ${payload.requestType}</p>
      <p><strong>Name:</strong> ${payload.name || "-"}</p>
      <p><strong>Email:</strong> ${payload.email}</p>
      <p><strong>Details:</strong></p>
      <pre style="white-space:pre-wrap;font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace;">${(payload.details || "(none)")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")}</pre>
      <p style="color:#666">Received: ${createdAt}</p>
    `;

    const userHtml = `
      <h2>We received your DSAR request</h2>
      <p>Hi ${payload.name || "there"},</p>
      <p>Thanks for contacting SecurePDF. We've received your <strong>${payload.requestType}</strong> request and will respond within 30 days.</p>
      <p><strong>Summary you sent:</strong></p>
      <pre style="white-space:pre-wrap;font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace;">${(payload.details || "(none)")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")}</pre>
      <p style="color:#666">If this wasn't you, reply to this email.</p>
    `;

    // Send to admin
    const adminSend = await resend.emails.send({
      from: "SecurePDF <onboarding@resend.dev>",
      to: [CONTACT_EMAIL],
      subject,
      html: adminHtml,
      text: `New DSAR Request\nType: ${payload.requestType}\nName: ${payload.name || "-"}\nEmail: ${payload.email}\n\nDetails:\n${payload.details || "(none)"}`,
      reply_to: [payload.email],
    });

    // Send confirmation to user
    const userSend = await resend.emails.send({
      from: "SecurePDF <onboarding@resend.dev>",
      to: [payload.email],
      subject: "We received your DSAR request",
      html: userHtml,
      text: `We received your DSAR request (${payload.requestType}).\nSummary you sent:\n${payload.details || "(none)"}`,
      reply_to: [CONTACT_EMAIL],
    });

    console.log("send-dsar-email sent", {
      adminTo: CONTACT_EMAIL,
      userTo: payload.email,
      adminId: adminSend.id,
      userId: userSend.id,
    });

    return new Response(
      JSON.stringify({ ok: true, adminId: adminSend.id, userId: userSend.id }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("send-dsar-email error", error);
    return new Response(JSON.stringify({ error: error.message || String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
