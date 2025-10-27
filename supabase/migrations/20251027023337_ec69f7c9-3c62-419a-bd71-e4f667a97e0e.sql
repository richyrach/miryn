-- Update handle_new_user trigger to set default account_type
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  placeholder_handle text;
BEGIN
  -- Generate placeholder handle: temp_ + first 12 chars of user ID
  placeholder_handle := 'temp_' || substr(NEW.id::text, 1, 12);
  
  -- Create minimal profile with placeholder data and default account type
  INSERT INTO public.profiles (user_id, handle, display_name, account_type)
  VALUES (
    NEW.id,
    placeholder_handle,
    'New User',
    'basic'
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block signup
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;