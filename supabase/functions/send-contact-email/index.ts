import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
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
    const payload = (await req.json()) as ContactPayload;
    if (!payload?.email || !isValidEmail(payload.email)) {
      return new Response(JSON.stringify({ error: "Invalid email" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const createdAt = new Date().toISOString();

    // Sanity check for API key presence
    if (!Deno.env.get("RESEND_API_KEY")) {
      console.error("RESEND_API_KEY is missing in Supabase secrets");
      return new Response(JSON.stringify({ error: "Missing RESEND_API_KEY in Supabase secrets" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const adminHtml = `
      <h2>New Contact Message</h2>
      <p><strong>Name:</strong> ${payload.name}</p>
      <p><strong>Email:</strong> ${payload.email}</p>
      <p><strong>Subject:</strong> ${payload.subject}</p>
      <p><strong>Message:</strong></p>
      <pre style="white-space:pre-wrap;font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace;">${payload.message
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")}</pre>
      <p style="color:#666">Received: ${createdAt}</p>
    `;

    const userHtml = `
      <h2>Thanks for contacting SecurePDF</h2>
      <p>Hi ${payload.name},</p>
      <p>We've received your message about "${payload.subject}" and will reply within 48 hours.</p>
      <p><strong>Your message:</strong></p>
      <pre style="white-space:pre-wrap;font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace;">${payload.message
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")}</pre>
    `;

    const serializeError = (err: any) => {
      try {
        if (!err) return 'Unknown error';
        if (typeof err === 'string') return err;
        if (typeof err.message === 'string') return err.message;
        // Resend SDK may nest details under response.error.message
        if (err?.response?.error?.message) return err.response.error.message;
        if (err?.name) return `${err.name}${err.statusCode ? ` (${err.statusCode})` : ''}`;
        return JSON.stringify(err);
      } catch {
        return String(err);
      }
    };

    // Send to admin
    const { data: adminData, error: adminError } = await resend.emails.send({
      from: "SecurePDF <onboarding@resend.dev>",
      to: [CONTACT_EMAIL],
      subject: `New contact: ${payload.subject}`,
      html: adminHtml,
      text: `New contact message from ${payload.name} <${payload.email}>\nSubject: ${payload.subject}\n\n${payload.message}`,
      reply_to: [payload.email],
    });
    if (adminError) {
      console.error("send-contact-email admin send error", adminError);
      const errMsg = serializeError(adminError);
      return new Response(JSON.stringify({ error: errMsg, where: 'admin' }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    
    // Send confirmation to user
    const { data: userData, error: userError } = await resend.emails.send({
      from: "SecurePDF <onboarding@resend.dev>",
      to: [payload.email],
      subject: "We received your message",
      html: userHtml,
      text: `Hi ${payload.name},\nWe received your message about "${payload.subject}" and will reply within 48 hours.\n\nYour message:\n${payload.message}`,
      reply_to: [CONTACT_EMAIL],
    });
    if (userError) {
      console.error("send-contact-email user send error", userError);
      const errMsg = serializeError(userError);
      return new Response(JSON.stringify({ error: errMsg, where: 'user' }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    
    console.log("send-contact-email sent", {
      adminTo: CONTACT_EMAIL,
      userTo: payload.email,
      adminId: adminData?.id,
      userId: userData?.id,
    });
    
    return new Response(
      JSON.stringify({ ok: true, adminId: adminData?.id, userId: userData?.id }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("send-contact-email error", error);
    return new Response(JSON.stringify({ error: error.message || String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
