import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

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

// Input validation limits
const MAX_NAME = 100;
const MAX_EMAIL = 255;
const MAX_SUBJECT = 200;
const MAX_MESSAGE = 5000;

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS_PER_WINDOW = 5; // 5 requests per hour per IP

// In-memory rate limit store (resets on function cold start)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(ip);
  
  if (!record || now > record.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  
  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }
  
  record.count++;
  return false;
}

function getClientIP(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
         req.headers.get("cf-connecting-ip") ||
         req.headers.get("x-real-ip") ||
         "unknown";
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
    // Rate limiting check
    const clientIP = getClientIP(req);
    if (isRateLimited(clientIP)) {
      console.warn("Rate limit exceeded for IP:", clientIP.substring(0, 10) + "...");
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    const payload = (await req.json()) as ContactPayload;

    // Validate email format
    if (!payload?.email || !isValidEmail(payload.email)) {
      return new Response(JSON.stringify({ error: "Invalid email" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Input length validation
    if ((payload.name?.length ?? 0) > MAX_NAME ||
      payload.email.length > MAX_EMAIL ||
      (payload.subject?.length ?? 0) > MAX_SUBJECT ||
      (payload.message?.length ?? 0) > MAX_MESSAGE) {
      return new Response(JSON.stringify({ error: "Input exceeds maximum length" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Validate required fields
    if (!payload.name?.trim() || !payload.subject?.trim() || !payload.message?.trim()) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
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

    // Escape HTML to prevent XSS
    const escapedName = payload.name.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const escapedSubject = payload.subject.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const escapedMessage = payload.message.replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const adminHtml = `
      <h2>New Contact Message</h2>
      <p><strong>Name:</strong> ${escapedName}</p>
      <p><strong>Email:</strong> ${payload.email}</p>
      <p><strong>Subject:</strong> ${escapedSubject}</p>
      <p><strong>Message:</strong></p>
      <pre style="white-space:pre-wrap;font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace;">${escapedMessage}</pre>
      <p style="color:#666">Received: ${createdAt}</p>
    `;

    const userHtml = `
      <h2>Thanks for contacting SecurePDF</h2>
      <p>Hi ${escapedName},</p>
      <p>We've received your message about "${escapedSubject}" and will reply within 48 hours.</p>
      <p><strong>Your message:</strong></p>
      <pre style="white-space:pre-wrap;font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace;">${escapedMessage}</pre>
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
      from: "SecurePDF <no-reply@notifications.securepdf.io>",
      to: [CONTACT_EMAIL],
      subject: `New contact: ${payload.subject.substring(0, 100)}`,
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
      from: "SecurePDF <no-reply@notifications.securepdf.io>",
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
      userTo: payload.email.substring(0, 20) + "...",
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
