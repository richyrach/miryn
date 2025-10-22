import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RateLimitRequest {
  emailType: 'verification' | 'password_reset' | 'email_change' | 'mfa';
  emailAddress?: string;
}

interface RateLimitRule {
  maxPerHour: number;
  maxPerDay: number;
  description: string;
}

const RATE_LIMITS: Record<string, RateLimitRule> = {
  verification: { maxPerHour: 3, maxPerDay: 10, description: "verification emails" },
  password_reset: { maxPerHour: 2, maxPerDay: 5, description: "password reset emails" },
  email_change: { maxPerHour: 2, maxPerDay: 5, description: "email change requests" },
  mfa: { maxPerHour: 3, maxPerDay: 10, description: "MFA codes" },
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (!error && user) {
        userId = user.id;
      }
    }

    const { emailType, emailAddress }: RateLimitRequest = await req.json();

    if (!emailType || !RATE_LIMITS[emailType]) {
      return new Response(
        JSON.stringify({ allowed: false, message: "Invalid email type" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const rule = RATE_LIMITS[emailType];
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Build query
    let query = supabase
      .from('email_rate_limits')
      .select('*', { count: 'exact' })
      .eq('email_type', emailType);

    if (userId) {
      query = query.eq('user_id', userId);
    } else if (emailAddress) {
      query = query.eq('email_address', emailAddress);
    } else {
      return new Response(
        JSON.stringify({ allowed: false, message: "User ID or email address required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check hourly limit
    const { count: hourlyCount } = await query
      .gte('sent_at', oneHourAgo.toISOString());

    if (hourlyCount && hourlyCount >= rule.maxPerHour) {
      return new Response(
        JSON.stringify({
          allowed: false,
          message: `Too many ${rule.description}. Please wait before trying again.`,
          retryAfter: 3600,
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check daily limit
    const { count: dailyCount } = await query
      .gte('sent_at', oneDayAgo.toISOString());

    if (dailyCount && dailyCount >= rule.maxPerDay) {
      return new Response(
        JSON.stringify({
          allowed: false,
          message: `Daily limit for ${rule.description} reached. Please try again tomorrow.`,
          retryAfter: 86400,
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Record this email send
    const { error: insertError } = await supabase
      .from('email_rate_limits')
      .insert({
        user_id: userId,
        email_address: emailAddress || null,
        email_type: emailType,
        sent_at: now.toISOString(),
      });

    if (insertError) {
      console.error('Error recording email send:', insertError);
    }

    return new Response(
      JSON.stringify({
        allowed: true,
        remaining: {
          hourly: rule.maxPerHour - (hourlyCount || 0) - 1,
          daily: rule.maxPerDay - (dailyCount || 0) - 1,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Rate limit check error:', error);
    return new Response(
      JSON.stringify({ allowed: false, message: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
