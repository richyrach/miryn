-- Create storage buckets for avatars and banners
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('banners', 'banners', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Add banner_url column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS banner_url text;

-- Storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policies for banners
CREATE POLICY "Banner images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'banners');

CREATE POLICY "Users can upload their own banner"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'banners' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own banner"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'banners' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own banner"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'banners' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create banned_users table
CREATE TABLE public.banned_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  banned_by uuid REFERENCES auth.users(id) NOT NULL,
  reason text,
  banned_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on banned_users
ALTER TABLE public.banned_users ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Security definer function to check if user has any admin role
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
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
    AND role IN ('owner', 'admin', 'moderator')
  )
$$;

-- Security definer function to check if user is banned
CREATE OR REPLACE FUNCTION public.is_banned(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.banned_users
    WHERE user_id = _user_id
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Anyone can view user roles"
ON public.user_roles FOR SELECT
USING (true);

CREATE POLICY "Only owner can insert roles"
ON public.user_roles FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Only owner can delete roles"
ON public.user_roles FOR DELETE
USING (public.has_role(auth.uid(), 'owner'));

-- RLS policies for banned_users
CREATE POLICY "Admins can view banned users"
ON public.banned_users FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can ban users"
ON public.banned_users FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can unban users"
ON public.banned_users FOR DELETE
USING (public.is_admin(auth.uid()));

-- Update public_profiles view to include banner_url and admin badge
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles AS
SELECT 
  p.id,
  p.handle,
  p.display_name,
  p.bio,
  p.avatar_url,
  p.banner_url,
  p.location,
  p.skills,
  p.intro_url,
  p.primary_cta,
  p.primary_cta_url,
  p.hireable,
  p.created_at,
  p.updated_at,
  COALESCE(
    (SELECT role::text 
     FROM public.user_roles ur 
     WHERE ur.user_id = p.user_id 
     ORDER BY 
       CASE 
         WHEN role = 'owner' THEN 1
         WHEN role = 'admin' THEN 2
         WHEN role = 'moderator' THEN 3
         ELSE 4
       END
     LIMIT 1),
    'user'
  ) as role
FROM public.profiles p
WHERE NOT public.is_banned(p.user_id);

-- Trigger to assign owner role to specific email
CREATE OR REPLACE FUNCTION public.assign_owner_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the user's email is the owner email
  IF NEW.email = 'richyrachfansgmial@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'owner')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_assign_owner
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.assign_owner_role();