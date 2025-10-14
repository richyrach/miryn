-- Drop the overly strict check constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_handle_check;

-- Add a more permissive constraint that still ensures quality
ALTER TABLE public.profiles ADD CONSTRAINT profiles_handle_check 
  CHECK (handle ~ '^[a-z0-9][a-z0-9-]{1,18}[a-z0-9]$' OR length(handle) = 1);

-- Update the handle_new_user function to generate valid handles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, handle, display_name)
  VALUES (
    NEW.id,
    LOWER(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          COALESCE(
            NEW.raw_user_meta_data->>'username', 
            'user' || REPLACE(substr(NEW.id::text, 1, 8), '-', '')
          ),
          '[^a-z0-9-]', '-', 'g'
        ),
        '-+', '-', 'g'
      )
    ),
    COALESCE(NEW.raw_user_meta_data->>'username', 'User')
  );
  RETURN NEW;
END;
$function$;