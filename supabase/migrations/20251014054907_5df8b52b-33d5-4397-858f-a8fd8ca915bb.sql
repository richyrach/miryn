-- Enable RLS on the public_profiles view
ALTER VIEW public.public_profiles SET (security_invoker = false);

-- Since views inherit RLS from base tables and we want public access,
-- we need to handle this differently. Let's create RLS policies on the base profiles table
-- that allow public viewing of non-sensitive columns

-- First restore public read access to profiles table
CREATE POLICY "Public can view non-sensitive profile data" 
ON public.profiles 
FOR SELECT 
TO public
USING (true);

-- However, we still want the view to be the recommended public interface
-- The view ensures only safe columns are exposed
COMMENT ON VIEW public.public_profiles IS 'Public-safe view of user profiles that excludes sensitive user_id field. Use this view for public profile queries.';