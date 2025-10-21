-- Add trigger to auto-add creator as participant
CREATE TRIGGER add_creator_participant 
AFTER INSERT ON public.conversations 
FOR EACH ROW 
EXECUTE FUNCTION public.add_creator_as_participant();

-- Add unique constraint to prevent duplicate participants
CREATE UNIQUE INDEX IF NOT EXISTS uq_conv_participant 
ON public.conversation_participants(conversation_id, user_id);

-- Add helpful indexes for lookups
CREATE INDEX IF NOT EXISTS idx_cp_user 
ON public.conversation_participants(user_id);

CREATE INDEX IF NOT EXISTS idx_cp_conversation 
ON public.conversation_participants(conversation_id);

-- Tighten conversation_participants INSERT policy
DROP POLICY IF EXISTS "Users can add participants to conversations" ON public.conversation_participants;

CREATE POLICY "Users can add participants to conversations"
ON public.conversation_participants
FOR INSERT
TO authenticated
WITH CHECK (
  (user_id = auth.uid()) 
  OR 
  (EXISTS (
    SELECT 1 
    FROM conversation_participants cp 
    WHERE cp.conversation_id = conversation_participants.conversation_id 
    AND cp.user_id = auth.uid()
  ))
);
