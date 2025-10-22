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
    toast({
      title: "Messaging unavailable",
      description: "Direct messages are temporarily disabled.",
      variant: "default",
    });
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