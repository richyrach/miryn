import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "resend";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { oldEmail, newEmail, displayName } = await req.json();

    if (!oldEmail || !newEmail || !displayName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const siteUrl = Deno.env.get("VITE_SUPABASE_URL")?.replace('supabase.co', 'lovableproject.com') || 'https://miryn.space';
    
    // Create HTML email
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Address Changed</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f6f9fc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f6f9fc; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="padding: 40px;">
              <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: bold; color: #333; text-align: center;">
                🔒 Email Address Changed
              </h1>
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #333;">
                Hi ${displayName},
              </p>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 24px; color: #333;">
                Your Miryn account email address has been changed.
              </p>
              <table width="100%" cellpadding="16" cellspacing="0" style="background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 5px; margin-bottom: 24px;">
                <tr>
                  <td>
                    <p style="margin: 8px 0; font-size: 14px; line-height: 24px; color: #333;">
                      <strong>Previous Email:</strong> ${oldEmail}
                    </p>
                    <p style="margin: 8px 0; font-size: 14px; line-height: 24px; color: #333;">
                      <strong>New Email:</strong> ${newEmail}
                    </p>
                    <p style="margin: 8px 0; font-size: 14px; line-height: 24px; color: #333;">
                      <strong>Date:</strong> ${new Date().toLocaleString()}
                    </p>
                  </td>
                </tr>
              </table>
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #d9534f;">
                ⚠️ <strong>If you didn't make this change:</strong>
              </p>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 24px; color: #333;">
                Your account may be compromised. Please contact support immediately and secure your account.
              </p>
              <div style="text-align: center; margin-bottom: 24px;">
                <a href="${siteUrl}/settings" style="display: inline-block; padding: 12px 32px; background-color: #d9534f; color: #ffffff; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold;">
                  Review Account Settings
                </a>
              </div>
              <p style="margin: 0; font-size: 12px; line-height: 22px; color: #898989;">
                This is a security notification. This email was sent to your previous email address for your protection.
                <br /><br />
                Best regards,<br />
                The Miryn Security Team
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

    // Send notification to old email
    const { error: emailError } = await resend.emails.send({
      from: "Miryn Security <security@resend.dev>",
      to: [oldEmail],
      subject: "Your Miryn Email Address Has Been Changed",
      html,
    });

    if (emailError) {
      console.error("Error sending email:", emailError);
      throw emailError;
    }

    console.log(`Email change notification sent to: ${oldEmail}`);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-email-change-notification:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});