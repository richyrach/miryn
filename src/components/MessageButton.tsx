import { useState } from "react";
import { Button } from "./ui/button";
import { MessageCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface MessageButtonProps {
  targetUserId: string;
  targetHandle: string;
}

export const MessageButton = ({ targetUserId }: MessageButtonProps) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleMessage = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to send messages",
          variant: "destructive",
        });
        return;
      }

      // Find existing conversation between the two users
      const { data: existingConversations } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);

      if (existingConversations) {
        for (const conv of existingConversations) {
          const { data: targetParticipant } = await supabase
            .from('conversation_participants')
            .select('conversation_id')
            .eq('conversation_id', conv.conversation_id)
            .eq('user_id', targetUserId)
            .single();

          if (targetParticipant) {
            navigate(`/messages?conversation=${conv.conversation_id}`);
            return;
          }
        }
      }

      // Create new conversation
      const { data: newConversation, error: convError } = await supabase
        .from('conversations')
        .insert({})
        .select()
        .single();

      if (convError) throw convError;

      // Add both participants
      const { error: participantsError } = await supabase
        .from('conversation_participants')
        .insert([
          { conversation_id: newConversation.id, user_id: user.id },
          { conversation_id: newConversation.id, user_id: targetUserId }
        ]);

      if (participantsError) throw participantsError;

      navigate(`/messages?conversation=${newConversation.id}`);
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: "Error",
        description: "Failed to start conversation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleMessage}
      variant="outline"
      size="sm"
      disabled={loading}
    >
      <MessageCircle className="w-4 h-4 mr-2" />
      Message
    </Button>
  );
};