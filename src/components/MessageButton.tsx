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

      // Check if conversation already exists
      const { data: existingParticipants } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.id);

      if (existingParticipants) {
        for (const participant of existingParticipants) {
          const { data: otherParticipant } = await supabase
            .from("conversation_participants")
            .select("user_id")
            .eq("conversation_id", participant.conversation_id)
            .eq("user_id", targetUserId)
            .single();

          if (otherParticipant) {
            navigate("/messages");
            return;
          }
        }
      }

      // Create new conversation
      const { data: conversation, error: convError } = await supabase
        .from("conversations")
        .insert({})
        .select()
        .single();

      if (convError) {
        console.error("Conversation creation error:", convError);
        throw convError;
      }

      // Add both participants in correct order
      const { error: partError } = await supabase
        .from("conversation_participants")
        .insert([
          { conversation_id: conversation.id, user_id: user.id },
          { conversation_id: conversation.id, user_id: targetUserId },
        ]);

      if (partError) {
        console.error("Participant addition error:", partError);
        throw partError;
      }

      navigate("/messages");
      toast({ title: "Conversation started!" });
    } catch (error: any) {
      console.error("Message button error:", error);
      toast({
        title: "Error starting conversation",
        description: error.message || "Please try again later",
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