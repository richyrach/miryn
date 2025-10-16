import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { ScrollArea } from "./ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { MessageCircle } from "lucide-react";

interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
  other_user: {
    id: string;
    display_name: string;
    handle: string;
    avatar_url: string | null;
  };
  last_message: {
    content: string;
    created_at: string;
    sender_id: string;
  } | null;
  unread_count: number;
}

interface ConversationListProps {
  onSelectConversation: (conversationId: string) => void;
  selectedConversationId: string | null;
}

export const ConversationList = ({ onSelectConversation, selectedConversationId }: ConversationListProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchConversations();
    subscribeToConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setCurrentUserId(user.id);

      const { data: participantData } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.id);

      if (!participantData || participantData.length === 0) {
        setLoading(false);
        return;
      }

      const conversationIds = participantData.map(p => p.conversation_id);

      const { data: conversationsData } = await supabase
        .from("conversations")
        .select(`
          id,
          created_at,
          updated_at
        `)
        .in("id", conversationIds)
        .order("updated_at", { ascending: false });

      if (conversationsData) {
        const enrichedConversations = await Promise.all(
          conversationsData.map(async (conv) => {
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
              .eq("conversation_id", conv.id)
              .neq("user_id", user.id)
              .single();

            const { data: lastMessage } = await supabase
              .from("messages")
              .select("content, created_at, sender_id")
              .eq("conversation_id", conv.id)
              .is("deleted_at", null)
              .order("created_at", { ascending: false })
              .limit(1)
              .single();

            const { count: unreadCount } = await supabase
              .from("messages")
              .select("*", { count: "exact", head: true })
              .eq("conversation_id", conv.id)
              .neq("sender_id", user.id)
              .is("deleted_at", null)
              .gt("created_at", (participants as any)?.last_read_at || conv.created_at);

            return {
              ...conv,
              other_user: participants?.profiles as any,
              last_message: lastMessage,
              unread_count: unreadCount || 0,
            };
          })
        );

        setConversations(enrichedConversations.filter(c => c.other_user));
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToConversations = () => {
    const channel = supabase
      .channel("conversations_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
        },
        () => {
          fetchConversations();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  if (loading) {
    return <div className="p-4">Loading conversations...</div>;
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <MessageCircle className="w-16 h-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No conversations yet</h3>
        <p className="text-sm text-muted-foreground">
          Start a conversation by messaging someone from their profile
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-1 p-2">
        {conversations.map((conversation) => (
          <button
            key={conversation.id}
            onClick={() => onSelectConversation(conversation.id)}
            className={`w-full text-left p-3 rounded-lg hover:bg-accent transition-colors ${
              selectedConversationId === conversation.id ? "bg-accent" : ""
            }`}
          >
            <div className="flex items-start gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={conversation.other_user.avatar_url || ""} />
                <AvatarFallback>
                  {conversation.other_user.display_name[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold truncate">
                    {conversation.other_user.display_name}
                  </p>
                  {conversation.last_message && (
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(conversation.last_message.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {conversation.last_message?.content || "No messages yet"}
                </p>
                {conversation.unread_count > 0 && (
                  <span className="inline-block mt-1 px-2 py-0.5 text-xs font-semibold bg-primary text-primary-foreground rounded-full">
                    {conversation.unread_count}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </ScrollArea>
  );
};
