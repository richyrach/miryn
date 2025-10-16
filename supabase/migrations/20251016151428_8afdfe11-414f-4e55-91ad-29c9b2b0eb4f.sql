-- Fix conversation creation RLS policies
-- The issue is that the trigger tries to add participants but RLS blocks it
-- We need to allow the first participant to be added to a new conversation

-- Drop the trigger that auto-adds creator (it's causing conflicts)
DROP TRIGGER IF EXISTS add_creator_as_participant_trigger ON conversations;

-- Update conversation_participants policy to allow adding first participant
DROP POLICY IF EXISTS "Users can add participants to conversations they're in" ON conversation_participants;

CREATE POLICY "Users can add participants to conversations"
ON conversation_participants
FOR INSERT
WITH CHECK (
  user_id = auth.uid() OR 
  -- Allow adding another user if you're already a participant
  EXISTS (
    SELECT 1 FROM conversation_participants cp
    WHERE cp.conversation_id = conversation_participants.conversation_id
    AND cp.user_id = auth.uid()
  ) OR
  -- Allow adding participants to new conversations (no participants yet)
  NOT EXISTS (
    SELECT 1 FROM conversation_participants cp
    WHERE cp.conversation_id = conversation_participants.conversation_id
  )
);

-- Update conversation_participants to allow updating last_read_at
DROP POLICY IF EXISTS "Users can update their participation" ON conversation_participants;

CREATE POLICY "Users can update their participation"
ON conversation_participants
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());