import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
.import { Resend } from "https://esm.sh/resend@2.0.0";

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
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Look up user by email
    const { data: authUser, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error("Error fetching users:", authError);
      return new Response(
        JSON.stringify({ message: "If an account exists with that email, recovery information has been sent." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const user = authUser.users.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (!user) {
      console.log(`No user found with email: ${email}`);
      // Don't reveal whether account exists
      return new Response(
        JSON.stringify({ message: "If an account exists with that email, recovery information has been sent." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get profile information
    const { data: profile } = await supabase
      .from("profiles")
      .select("handle, display_name, created_at")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      console.log(`No profile found for user: ${user.id}`);
      return new Response(
        JSON.stringify({ message: "If an account exists with that email, recovery information has been sent." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const siteUrl = Deno.env.get("SITE_) || 'https://miryn.vercel.app';
    
    // Create HTML email
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Miryn Account Details</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f6f9fc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f6f9fc; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="padding: 40px;">
              <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: bold; color: #333; text-align: center;">
                Your Miryn Account Details
              </h1>
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #333;">
                Hi there!
              </p>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 24px; color: #333;">
                You requested your account information. Here are your account details:
              </p>
              <table width="100%" cellpadding="16" cellspacing="0" style="background-color: #f4f4f4; border-radius: 5px; margin-bottom: 24px;">
                <tr>
                  <td>
                    <p style="margin: 8px 0; font-size: 14px; line-height: 24px; color: #333;">
                      <strong>Username:</strong> @${profile.handle}
                    </p>
                    <p style="margin: 8px 0; font-size: 14px; line-height: 24px; color: #333;">
                      <strong>Display Name:</strong> ${profile.display_name}
                    </p>
                    <p style="margin: 8px 0; font-size: 14px; line-height: 24px; color: #333;">
                      <strong>Email:</strong> ${user.email}
                    </p>
                    <p style="margin: 8px 0; font-size: 14px; line-height: 24px; color: #333;">
                      <strong>Account Created:</strong> ${new Date(profile.created_at).toLocaleDateString()}
                    </p>
                  </td>
                </tr>
              </table>
              <div style="text-align: center; margin-bottom: 24px;">
                <a href="${siteUrl}/auth" style="display: inline-block; padding: 12px 32px; background-color: #5469d4; color: #ffffff; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold;">
                  Sign In to Your Account
                </a>
              </div>
              <p style="margin: 0 0 8px; font-size: 14px; line-height: 22px; color: #898989;">
                If you didn't request this email, you can safely ignore it.
              </p>
              <p style="margin: 0; font-size: 12px; line-height: 22px; color: #898989;">
                Best regards,<br />
                The Miryn Team
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

    // Send recovery email
    const { error: emailError } = await resend.emails.send({
      from: "Miryn <onboarding@resend.dev>",
      to: [user.email!],
      subject: "Your Miryn Account Details",
      html,
    });

    if (emailError) {
      console.error("Error sending email:", emailError);
      throw emailError;
    }

    console.log(`Recovery email sent to: ${email}`);

    return new Response(
      JSON.stringify({ message: "If an account exists with that email, recovery information has been sent." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-account-recovery:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
