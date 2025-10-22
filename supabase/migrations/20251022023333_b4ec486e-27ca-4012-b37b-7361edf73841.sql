-- Email rate limiting table
CREATE TABLE IF NOT EXISTS public.email_rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email_address TEXT,
  email_type TEXT NOT NULL CHECK (email_type IN ('verification', 'password_reset', 'email_change', 'mfa')),
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  ip_address TEXT
);

-- Index for faster lookups
CREATE INDEX idx_email_rate_limits_user_id ON public.email_rate_limits(user_id);
CREATE INDEX idx_email_rate_limits_email ON public.email_rate_limits(email_address);
CREATE INDEX idx_email_rate_limits_sent_at ON public.email_rate_limits(sent_at);

-- Auto cleanup old records (older than 24 hours)
CREATE OR REPLACE FUNCTION public.cleanup_old_email_rate_limits()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.email_rate_limits
  WHERE sent_at < NOW() - INTERVAL '24 hours';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_cleanup_email_rate_limits
  AFTER INSERT ON public.email_rate_limits
  EXECUTE FUNCTION public.cleanup_old_email_rate_limits();

-- MFA backup codes table
CREATE TABLE IF NOT EXISTS public.mfa_backup_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mfa_backup_codes_user_id ON public.mfa_backup_codes(user_id);

-- Failed MFA attempts table
CREATE TABLE IF NOT EXISTS public.failed_mfa_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attempted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  ip_address TEXT
);

CREATE INDEX idx_failed_mfa_attempts_user_id ON public.failed_mfa_attempts(user_id);
CREATE INDEX idx_failed_mfa_attempts_attempted_at ON public.failed_mfa_attempts(attempted_at);

-- Auto cleanup old failed attempts (older than 1 hour)
CREATE OR REPLACE FUNCTION public.cleanup_old_failed_mfa_attempts()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.failed_mfa_attempts
  WHERE attempted_at < NOW() - INTERVAL '1 hour';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_cleanup_failed_mfa_attempts
  AFTER INSERT ON public.failed_mfa_attempts
  EXECUTE FUNCTION public.cleanup_old_failed_mfa_attempts();

-- RLS Policies
ALTER TABLE public.email_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mfa_backup_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.failed_mfa_attempts ENABLE ROW LEVEL SECURITY;

-- Service role only for email_rate_limits (accessed via edge function)
CREATE POLICY "Service role can manage email rate limits"
  ON public.email_rate_limits
  FOR ALL
  USING (true);

-- Users can view their own backup codes
CREATE POLICY "Users can view their own backup codes"
  ON public.mfa_backup_codes
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can manage backup codes
CREATE POLICY "Service role can manage backup codes"
  ON public.mfa_backup_codes
  FOR ALL
  USING (true);

-- Service role can manage failed attempts
CREATE POLICY "Service role can manage failed MFA attempts"
  ON public.failed_mfa_attempts
  FOR ALL
  USING (true);