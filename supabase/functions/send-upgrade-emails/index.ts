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
  console.log(`[SEND-UPGRADE-EMAILS] ${step}${detailsStr}`);
};

// Email templates for the 3-email sequence
const emailTemplates = {
  upgrade_day_3: {
    subject: "Unlock the full power of SecurePDF 🔓",
    getHtml: (email: string) => `
      <div style="font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial, sans-serif; line-height:1.6; max-width:600px; margin:0 auto;">
        <div style="background:#1a1a2e; padding:20px; text-align:center; border-radius:8px 8px 0 0;">
          <h1 style="color:#fff; margin:0; font-size:24px;">🔒 SecurePDF</h1>
          <p style="color:#a0a0a0; margin:8px 0 0; font-size:14px;">Protect your PDFs with confidence</p>
        </div>
        <div style="padding:24px; background:#ffffff; border:1px solid #eee; border-top:none; border-radius:0 0 8px 8px;">
          <h2 style="margin:0 0 16px; color:#1a1a2e;">Ready to protect more PDFs?</h2>
          <p style="color:#333;">Hi there! You've been using SecurePDF for a few days now. We hope you're enjoying the simplicity and security!</p>
          <p style="color:#333;">Did you know that with a Pro plan, you can:</p>
          <ul style="color:#333; padding-left:20px;">
            <li><strong>Protect up to 50 PDFs per day</strong> (vs 1 on Free)</li>
            <li><strong>Handle files up to 10MB</strong> (vs 250KB on Free)</li>
            <li><strong>Use Batch Mode</strong> to protect multiple files at once</li>
          </ul>
          <div style="text-align:center; margin:24px 0;">
            <a href="https://securepdf.io/pricing" style="display:inline-block; background:#1a1a2e; color:#fff; padding:14px 28px; border-radius:6px; text-decoration:none; font-weight:600;">Explore Plans</a>
          </div>
          <hr style="border:none;border-top:1px solid #eee;margin:20px 0;" />
          <p style="color:#666; font-size:14px;">Questions? Reply to this email or contact us at info@securepdf.io</p>
          <p style="color:#999; font-size:12px; margin-top:20px;">You're receiving this because you signed up for SecurePDF. <a href="https://securepdf.io/privacy-policy" style="color:#999;">Unsubscribe</a></p>
        </div>
      </div>
    `,
  },
  upgrade_day_7: {
    subject: "You've hit your daily limit 3 times this week 📊",
    getHtml: (email: string) => `
      <div style="font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial, sans-serif; line-height:1.6; max-width:600px; margin:0 auto;">
        <div style="background:#1a1a2e; padding:20px; text-align:center; border-radius:8px 8px 0 0;">
          <h1 style="color:#fff; margin:0; font-size:24px;">🔒 SecurePDF</h1>
          <p style="color:#a0a0a0; margin:8px 0 0; font-size:14px;">Protect your PDFs with confidence</p>
        </div>
        <div style="padding:24px; background:#ffffff; border:1px solid #eee; border-top:none; border-radius:0 0 8px 8px;">
          <h2 style="margin:0 0 16px; color:#1a1a2e;">Need more PDF protections?</h2>
          <p style="color:#333;">We noticed you're an active SecurePDF user! It looks like you might benefit from upgrading.</p>
          <div style="background:#f8f9fa; padding:16px; border-radius:8px; margin:20px 0;">
            <h3 style="margin:0 0 12px; color:#1a1a2e;">What you're missing:</h3>
            <table style="width:100%; border-collapse:collapse;">
              <tr style="border-bottom:1px solid #eee;">
                <td style="padding:8px 0; color:#666;">Daily Files</td>
                <td style="padding:8px 0; color:#999;">Free: 1</td>
                <td style="padding:8px 0; color:#1a1a2e; font-weight:bold;">Pro: 50</td>
              </tr>
              <tr style="border-bottom:1px solid #eee;">
                <td style="padding:8px 0; color:#666;">Max File Size</td>
                <td style="padding:8px 0; color:#999;">Free: 250KB</td>
                <td style="padding:8px 0; color:#1a1a2e; font-weight:bold;">Pro: 10MB</td>
              </tr>
              <tr>
                <td style="padding:8px 0; color:#666;">Batch Mode</td>
                <td style="padding:8px 0; color:#999;">Free: ❌</td>
                <td style="padding:8px 0; color:#1a1a2e; font-weight:bold;">Pro: ✅</td>
              </tr>
            </table>
          </div>
          <div style="text-align:center; margin:24px 0;">
            <a href="https://securepdf.io/pricing" style="display:inline-block; background:#1a1a2e; color:#fff; padding:14px 28px; border-radius:6px; text-decoration:none; font-weight:600;">Upgrade Now</a>
          </div>
          <hr style="border:none;border-top:1px solid #eee;margin:20px 0;" />
          <p style="color:#666; font-size:14px;">Questions? Reply to this email or contact us at info@securepdf.io</p>
          <p style="color:#999; font-size:12px; margin-top:20px;">You're receiving this because you signed up for SecurePDF. <a href="https://securepdf.io/privacy-policy" style="color:#999;">Unsubscribe</a></p>
        </div>
      </div>
    `,
  },
  upgrade_day_14: {
    subject: "Last chance: Custom passwords & batch mode await ✨",
    getHtml: (email: string) => `
      <div style="font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial, sans-serif; line-height:1.6; max-width:600px; margin:0 auto;">
        <div style="background:#1a1a2e; padding:20px; text-align:center; border-radius:8px 8px 0 0;">
          <h1 style="color:#fff; margin:0; font-size:24px;">🔒 SecurePDF</h1>
          <p style="color:#a0a0a0; margin:8px 0 0; font-size:14px;">Protect your PDFs with confidence</p>
        </div>
        <div style="padding:24px; background:#ffffff; border:1px solid #eee; border-top:none; border-radius:0 0 8px 8px;">
          <h2 style="margin:0 0 16px; color:#1a1a2e;">Pro features you're missing out on</h2>
          <p style="color:#333;">You've been using SecurePDF for two weeks now. Here's what Pro users love most:</p>
          <div style="margin:20px 0;">
            <div style="display:flex; align-items:start; margin-bottom:16px;">
              <span style="font-size:24px; margin-right:12px;">📦</span>
              <div>
                <strong style="color:#1a1a2e;">Batch Encryption Mode</strong>
                <p style="color:#666; margin:4px 0 0;">Protect dozens of PDFs at once - no more one-by-one uploads.</p>
              </div>
            </div>
            <div style="display:flex; align-items:start; margin-bottom:16px;">
              <span style="font-size:24px; margin-right:12px;">🔑</span>
              <div>
                <strong style="color:#1a1a2e;">Custom Password Settings</strong>
                <p style="color:#666; margin:4px 0 0;">Set your own password length and complexity requirements.</p>
              </div>
            </div>
            <div style="display:flex; align-items:start;">
              <span style="font-size:24px; margin-right:12px;">📁</span>
              <div>
                <strong style="color:#1a1a2e;">Larger Files</strong>
                <p style="color:#666; margin:4px 0 0;">Handle files up to 10MB - perfect for detailed documents.</p>
              </div>
            </div>
          </div>
          <div style="text-align:center; margin:24px 0;">
            <a href="https://securepdf.io/pricing" style="display:inline-block; background:#1a1a2e; color:#fff; padding:14px 28px; border-radius:6px; text-decoration:none; font-weight:600;">View Pro Features</a>
          </div>
          <hr style="border:none;border-top:1px solid #eee;margin:20px 0;" />
          <p style="color:#666; font-size:14px;">Questions? Reply to this email or contact us at info@securepdf.io</p>
          <p style="color:#999; font-size:12px; margin-top:20px;">You're receiving this because you signed up for SecurePDF. <a href="https://securepdf.io/privacy-policy" style="color:#999;">Unsubscribe</a></p>
        </div>
      </div>
    `,
  },
};

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

    logStep("Starting upgrade email job");

    const now = new Date();

    // Get free tier users who haven't received certain emails yet
    const { data: freeUsers, error: usersError } = await supabaseClient
      .from("profiles")
      .select("user_id, email, created_at")
      .eq("subscription_tier", "free");

    if (usersError) {
      logStep("Error fetching free users", { error: usersError });
      throw usersError;
    }

    logStep("Found free users", { count: freeUsers?.length || 0 });

    let emailsSent = 0;

    for (const user of freeUsers || []) {
      const createdAt = new Date(user.created_at);
      const daysSinceSignup = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

      let emailType: "upgrade_day_3" | "upgrade_day_7" | "upgrade_day_14" | null = null;

      // Determine which email to send based on days since signup
      if (daysSinceSignup >= 14) {
        emailType = "upgrade_day_14";
      } else if (daysSinceSignup >= 7) {
        emailType = "upgrade_day_7";
      } else if (daysSinceSignup >= 3) {
        emailType = "upgrade_day_3";
      }

      if (!emailType) continue;

      // Check if this email was already sent
      const { data: existingEmail } = await supabaseClient
        .from("email_automations")
        .select("id")
        .eq("user_id", user.user_id)
        .eq("email_type", emailType)
        .maybeSingle();

      if (existingEmail) {
        // Already sent this email, try the previous one if applicable
        if (emailType === "upgrade_day_14") {
          const { data: day7Email } = await supabaseClient
            .from("email_automations")
            .select("id")
            .eq("user_id", user.user_id)
            .eq("email_type", "upgrade_day_7")
            .maybeSingle();
          
          if (!day7Email && daysSinceSignup >= 7) {
            emailType = "upgrade_day_7";
          } else {
            continue;
          }
        } else if (emailType === "upgrade_day_7") {
          const { data: day3Email } = await supabaseClient
            .from("email_automations")
            .select("id")
            .eq("user_id", user.user_id)
            .eq("email_type", "upgrade_day_3")
            .maybeSingle();
          
          if (!day3Email && daysSinceSignup >= 3) {
            emailType = "upgrade_day_3";
          } else {
            continue;
          }
        } else {
          continue;
        }
      }

      // Re-check after potential emailType change
      const { data: checkAgain } = await supabaseClient
        .from("email_automations")
        .select("id")
        .eq("user_id", user.user_id)
        .eq("email_type", emailType)
        .maybeSingle();

      if (checkAgain) continue;

      const template = emailTemplates[emailType];

      try {
        const { error: sendError } = await resend.emails.send({
          from: "SecurePDF <no-reply@notifications.securepdf.io>",
          to: [user.email],
          subject: template.subject,
          html: template.getHtml(user.email),
          replyTo: ["info@securepdf.io"],
        });

        if (sendError) {
          logStep("Failed to send email", { email: user.email.substring(0, 20) + "...", error: sendError });
          continue;
        }

        // Record that email was sent
        await supabaseClient
          .from("email_automations")
          .insert({
            user_id: user.user_id,
            email_type: emailType,
          });

        emailsSent++;
        logStep("Email sent", { email: user.email.substring(0, 20) + "...", type: emailType });
      } catch (emailError) {
        logStep("Email send error", { error: emailError });
      }
    }

    logStep("Job complete", { emails_sent: emailsSent });

    return new Response(JSON.stringify({ success: true, emails_sent: emailsSent }), {
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
