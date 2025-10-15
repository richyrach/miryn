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

    try {
      const { data: myConvs } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", currentUserId);

      if (myConvs) {
        for (const conv of myConvs) {
          const { data: otherPart } = await supabase
            .from("conversation_participants")
            .select("user_id")
            .eq("conversation_id", conv.conversation_id)
            .neq("user_id", currentUserId)
            .maybeSingle();

          if (otherPart && otherPart.user_id === targetUserId) {
            navigate("/messages");
            setLoading(false);
            return;
          }
        }
      }

      const { data: newConv, error: convError } = await supabase
        .from("conversations")
        .insert({})
        .select()
        .single();

      if (convError || !newConv) throw convError || new Error("Failed to create conversation");

      // Add both participants in a single transaction
      // First add yourself (the creator), then add the target user
      const { error: participantError } = await supabase
        .from("conversation_participants")
        .insert([
          { conversation_id: newConv.id, user_id: currentUserId },  // Add creator
          { conversation_id: newConv.id, user_id: targetUserId }    // Add target user
        ]);

      if (participantError) throw participantError;

      toast({
        title: "Conversation started",
        description: `You can now message @${targetHandle}`
      });
      
      navigate("/messages");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to start conversation",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
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