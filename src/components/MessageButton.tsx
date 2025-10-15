import { useState } from "react";
import { Button } from "./ui/button";
import { supabase } from "@/integrations/supabase/client";
import { MessageCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface MessageButtonProps {
  targetUserId: string;
  targetHandle: string;
}

export const MessageButton = ({ targetUserId, targetHandle }: MessageButtonProps) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleMessage = async () => {
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      toast({
        title: "Sign in required",
        description: "Please sign in to send messages",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    const currentUserId = session.user.id;

    if (currentUserId === targetUserId) {
      toast({
        title: "Cannot message yourself",
        description: "Please select another user",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    // Check if conversation already exists
    const { data: existingParticipants } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", currentUserId);

    if (existingParticipants) {
      for (const p of existingParticipants) {
        const { data: otherParticipant } = await supabase
          .from("conversation_participants")
          .select("user_id")
          .eq("conversation_id", p.conversation_id)
          .eq("user_id", targetUserId)
          .maybeSingle();

        if (otherParticipant) {
          // Conversation exists, navigate to messages
          navigate("/messages");
          setLoading(false);
          return;
        }
      }
    }

    // Create new conversation
    const { data: newConv, error: convError } = await supabase
      .from("conversations")
      .insert({})
      .select()
      .single();

    if (convError || !newConv) {
      toast({
        title: "Error",
        description: "Failed to create conversation",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    // Add the other participant (current user is auto-added by trigger)
    const { error: participantsError } = await supabase
      .from("conversation_participants")
      .insert([
        { conversation_id: newConv.id, user_id: targetUserId }
      ]);

    if (participantsError) {
      toast({
        title: "Error",
        description: "Failed to add participants",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: `Started conversation with @${targetHandle}`
      });
      navigate("/messages");
    }

    setLoading(false);
  };

  return (
    <Button
      onClick={handleMessage}
      disabled={loading}
      variant="outline"
      size="sm"
    >
      <MessageCircle className="w-4 h-4 mr-2" />
      Message
    </Button>
  );
};