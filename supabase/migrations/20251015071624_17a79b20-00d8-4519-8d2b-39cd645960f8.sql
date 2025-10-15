-- Fix search_path warning for is_ban_active function
CREATE OR REPLACE FUNCTION is_ban_active(ban_record banned_users)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT 
    ban_record.unbanned_at IS NULL AND 
    (ban_record.expires_at IS NULL OR ban_record.expires_at > NOW())
$$;