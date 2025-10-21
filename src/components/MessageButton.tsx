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

      // Validate targetUserId format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(targetUserId)) {
        toast({
          title: "Error",
          description: "Invalid user ID",
          variant: "destructive",
        });
        return;
      }

      // Call backend function to start conversation
      const { data, error } = await supabase.functions.invoke('start-conversation', {
        body: { targetUserId }
      });

      if (error) throw error;

      navigate(`/messages?conversation=${data.conversationId}`);
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