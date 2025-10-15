-- Fix the handle generation to ensure valid handles
-- The current function can generate handles with uppercase or invalid characters
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_handle text;
  final_handle text;
  handle_suffix int := 0;
BEGIN
  -- Generate base handle from username or fallback
  base_handle := LOWER(
    REGEXP_REPLACE(
      COALESCE(
        NEW.raw_user_meta_data->>'username',
        'user'
      ),
      '[^a-z0-9]', '', 'g'  -- Remove all non-alphanumeric chars
    )
  );
  
  -- Ensure minimum length of 3 by padding if needed
  IF LENGTH(base_handle) < 3 THEN
    base_handle := base_handle || REPLACE(substr(NEW.id::text, 1, 8), '-', '');
  END IF;
  
  -- Truncate to max 20 characters
  base_handle := substr(base_handle, 1, 20);
  
  -- Try to insert with base handle, add suffix if conflict
  final_handle := base_handle;
  
  WHILE EXISTS (SELECT 1 FROM profiles WHERE handle = final_handle) LOOP
    handle_suffix := handle_suffix + 1;
    final_handle := substr(base_handle, 1, 20 - LENGTH(handle_suffix::text)) || handle_suffix::text;
  END LOOP;
  
  INSERT INTO public.profiles (user_id, handle, display_name)
  VALUES (
    NEW.id,
    final_handle,
    COALESCE(NEW.raw_user_meta_data->>'username', 'User')
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block signup
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Fix conversation_participants infinite recursion by using a security definer function
CREATE OR REPLACE FUNCTION public.user_in_conversation(_user_id uuid, _conversation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM conversation_participants
    WHERE user_id = _user_id AND conversation_id = _conversation_id
  )
$$;

-- Update conversation_participants policies to use the function
DROP POLICY IF EXISTS "Users can view participants of their conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can add participants to conversations they're in" ON conversation_participants;

CREATE POLICY "Users can view participants of their conversations"
ON conversation_participants
FOR SELECT
USING (user_in_conversation(auth.uid(), conversation_id));

CREATE POLICY "Users can add participants to conversations they're in"
ON conversation_participants
FOR INSERT
WITH CHECK (user_in_conversation(auth.uid(), conversation_id));