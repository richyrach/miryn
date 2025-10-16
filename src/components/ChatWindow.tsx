import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { ScrollArea } from "./ui/scroll-area";
import { MessageInput } from "./MessageInput";
import { formatDistanceToNow } from "date-fns";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  edited_at: string | null;
  sender: {
    display_name: string;
    avatar_url: string | null;
  };
}

interface ChatWindowProps {
  conversationId: string;
}

export const ChatWindow = ({ conversationId }: ChatWindowProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [otherUser, setOtherUser] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    subscribeToMessages();
    markAsRead();
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const fetchMessages = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setCurrentUserId(user.id);

      const { data: participants } = await supabase
        .from("conversation_participants")
        .select(`
          user_id,
          profiles:user_id (
            id,
            display_name,
            handle,
            avatar_url
          )
        `)
        .eq("conversation_id", conversationId)
        .neq("user_id", user.id)
        .single();

      setOtherUser(participants?.profiles);

      const { data } = await supabase
        .from("messages")
        .select(`
          id,
          content,
          sender_id,
          created_at,
          edited_at,
          profiles:sender_id (
            display_name,
            avatar_url
          )
        `)
        .eq("conversation_id", conversationId)
        .is("deleted_at", null)
        .order("created_at", { ascending: true });

      if (data) {
        setMessages(data.map(m => ({
          ...m,
          sender: m.profiles as any
        })));
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`messages_${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          fetchMessages();
          markAsRead();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const markAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("conversation_participants")
      .update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .eq("user_id", user.id);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      {otherUser && (
        <div className="border-b p-4 flex items-center gap-3">
          <Avatar>
            <AvatarImage src={otherUser.avatar_url || ""} />
            <AvatarFallback>{otherUser.display_name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">{otherUser.display_name}</h3>
            <p className="text-sm text-muted-foreground">@{otherUser.handle}</p>
          </div>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message) => {
            const isOwnMessage = message.sender_id === currentUserId;
            return (
              <div
                key={message.id}
                className={`flex gap-3 ${isOwnMessage ? "flex-row-reverse" : ""}`}
              >
                <Avatar className="w-8 h-8">
                  <AvatarImage src={message.sender.avatar_url || ""} />
                  <AvatarFallback>{message.sender.display_name[0]}</AvatarFallback>
                </Avatar>
                <div className={`flex flex-col ${isOwnMessage ? "items-end" : ""}`}>
                  <div
                    className={`px-4 py-2 rounded-lg max-w-md ${
                      isOwnMessage
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm break-words">{message.content}</p>
                  </div>
                  <span className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(message.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Input */}
      <MessageInput conversationId={conversationId} />
    </div>
  );
};
