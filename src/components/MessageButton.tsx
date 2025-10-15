import { Button } from "./ui/button";
import { MessageCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Badge } from "./ui/badge";

interface MessageButtonProps {
  targetUserId: string;
  targetHandle: string;
}

export const MessageButton = ({ targetUserId, targetHandle }: MessageButtonProps) => {

  const handleMessage = () => {
    toast({
      title: "Coming Soon",
      description: "Direct messaging feature is currently being improved and will be available soon!",
    });
  };

  return (
    <div className="relative inline-block">
      <Button
        onClick={handleMessage}
        variant="outline"
        size="sm"
      >
        <MessageCircle className="w-4 h-4 mr-2" />
        Message
      </Button>
      <Badge className="absolute -top-2 -right-2 bg-primary text-xs px-1.5 py-0.5">
        Soon
      </Badge>
    </div>
  );
};