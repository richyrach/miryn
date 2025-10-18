-- Extend app_role enum to include all role types
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'partner';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'verified';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'developer';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'early_supporter';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'vip';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'content_mod';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'junior_mod';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'support';

-- Create capability function for moderation powers
CREATE OR REPLACE FUNCTION public.has_moderation(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id 
    AND role IN ('owner', 'admin', 'moderator', 'content_mod')
  )
$$;

-- Create capability function for support powers
CREATE OR REPLACE FUNCTION public.has_support(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id 
    AND role IN ('owner', 'admin', 'moderator', 'support')
  )
$$;

-- Update user_roles insert policy to allow admins to assign certain roles
DROP POLICY IF EXISTS "Only owner can insert roles" ON public.user_roles;

CREATE POLICY "Owner can insert any role, admins can insert limited roles"
ON public.user_roles
FOR INSERT
WITH CHECK (
  -- Owner can assign any role
  has_role(auth.uid(), 'owner') OR
  -- Admins can assign these roles only
  (is_admin(auth.uid()) AND role IN ('moderator', 'content_mod', 'junior_mod', 'support', 'verified', 'partner', 'vip', 'early_supporter', 'developer'))
);

-- Allow has_moderation to soft-delete comments
DROP POLICY IF EXISTS "Admins can soft delete any comment" ON public.project_comments;

CREATE POLICY "Moderators can soft delete any comment"
ON public.project_comments
FOR UPDATE
USING (has_moderation(auth.uid()));

-- Allow has_support to view reports
DROP POLICY IF EXISTS "Admins can view reports" ON public.reports;

CREATE POLICY "Support staff can view reports"
ON public.reports
FOR SELECT
USING (has_support(auth.uid()));

-- Keep other admin policies using is_admin for high-risk actions
-- (delete users, ban, etc. already use is_admin which is owner/admin/moderator)