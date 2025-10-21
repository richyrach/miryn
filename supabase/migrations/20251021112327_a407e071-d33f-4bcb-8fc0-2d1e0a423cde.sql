-- Enable UPDATE on conversations for participants
CREATE POLICY "Participants can update conversation metadata"
ON conversations
FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT conversation_id 
    FROM conversation_participants 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  id IN (
    SELECT conversation_id 
    FROM conversation_participants 
    WHERE user_id = auth.uid()
  )
);