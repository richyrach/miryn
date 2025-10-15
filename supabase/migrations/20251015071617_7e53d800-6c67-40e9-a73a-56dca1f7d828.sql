-- Enhance Admin Panel: Add warnings, timed bans, and unbanning

-- Add warnings table
CREATE TABLE user_warnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  warned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  severity TEXT DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on warnings
ALTER TABLE user_warnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view warnings"
ON user_warnings FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can create warnings"
ON user_warnings FOR INSERT
TO authenticated
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can delete warnings"
ON user_warnings FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));

-- Add expires_at column to banned_users for timed bans
ALTER TABLE banned_users 
ADD COLUMN expires_at TIMESTAMPTZ;

-- Add unbanned_at and unbanned_by for tracking unbans
ALTER TABLE banned_users
ADD COLUMN unbanned_at TIMESTAMPTZ,
ADD COLUMN unbanned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Function to check if a ban is active (not expired and not unbanned)
CREATE OR REPLACE FUNCTION is_ban_active(ban_record banned_users)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT 
    ban_record.unbanned_at IS NULL AND 
    (ban_record.expires_at IS NULL OR ban_record.expires_at > NOW())
$$;

-- Update the is_banned function to check for active bans only
CREATE OR REPLACE FUNCTION public.is_banned(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.banned_users
    WHERE user_id = _user_id 
      AND unbanned_at IS NULL
      AND (expires_at IS NULL OR expires_at > NOW())
  )
$function$;

-- Function to get warning count for a user
CREATE OR REPLACE FUNCTION get_warning_count(target_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM user_warnings
  WHERE user_id = target_user_id;
$$;