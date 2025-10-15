-- Add social links, custom links, and customization to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS custom_links jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS theme_color text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS profile_layout text DEFAULT 'default';

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.social_links IS 'Array of social media links: [{ platform: "instagram" | "youtube" | "discord" | "github" | "twitter" | "linkedin" | "tiktok" | "twitch", url: "https://..." }]';
COMMENT ON COLUMN public.profiles.custom_links IS 'Array of custom links: [{ name: "My Website", url: "https://...", logo_url: "https://..." }]';
COMMENT ON COLUMN public.profiles.theme_color IS 'User preferred accent color in HSL format';
COMMENT ON COLUMN public.profiles.profile_layout IS 'Profile layout preference: "default" | "minimal" | "showcase"';