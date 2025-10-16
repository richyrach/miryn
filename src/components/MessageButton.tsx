import { useState } from "react";
import { Button } from "./ui/button";
import { MessageCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

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
      toast({
        title: "Direct messages",
        description: "This feature is coming soon",
      });
      navigate("/messages");
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
      Message (Soon)
    </Button>
  );
};