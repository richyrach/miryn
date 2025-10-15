-- Add trigger to auto-add creator as participant to conversations BEFORE INSERT so that RLS SELECT on RETURNING succeeds
-- and Message button flow works when using insert().select().

-- Create trigger if it doesn't exist
DO $$
BEGIN
  -- Drop existing trigger if present to ensure correct timing (BEFORE INSERT)
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_conversation_created'
  ) THEN
    DROP TRIGGER on_conversation_created ON public.conversations;
  END IF;

  -- Create BEFORE INSERT trigger to add creator as participant
  CREATE TRIGGER on_conversation_created
  BEFORE INSERT ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.add_creator_as_participant();
END $$;

-- Optional: ensure updated_at is maintained (nice-to-have for UX ordering)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'conversations_handle_updated_at'
  ) THEN
    CREATE TRIGGER conversations_handle_updated_at
    BEFORE UPDATE ON public.conversations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;