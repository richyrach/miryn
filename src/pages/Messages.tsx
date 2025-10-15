import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Send, Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
  other_user: {
    id: string;
    user_id: string;
    display_name: string;
    handle: string;
    avatar_url: string | null;
  } | null;
  last_message: {
    content: string;
    created_at: string;
  } | null;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  sender_name: string;
}

const Messages = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "name">("recent");

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      fetchConversations();
    }
  }, [currentUserId]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
      const cleanup = subscribeToMessages(selectedConversation);
      return cleanup;
    }
  }, [selectedConversation]);

  useEffect(() => {
    filterAndSortConversations();
  }, [conversations, searchTerm, sortBy]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setCurrentUserId(session.user.id);
    }
    setLoading(false);
  };

  const filterAndSortConversations = () => {
    let filtered = [...conversations];

    if (searchTerm) {
      filtered = filtered.filter(conv =>
        conv.other_user?.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.other_user?.handle.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (sortBy === "recent") {
      filtered.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    } else {
      filtered.sort((a, b) => 
        (a.other_user?.display_name || "").localeCompare(b.other_user?.display_name || "")
      );
    }

    setFilteredConversations(filtered);
  };

  const fetchConversations = async () => {
    if (!currentUserId) return;

    try {
      const { data: myParticipants, error: partError } = await supabase
        .from("conversation_participants")
        .select("conversation_id, conversation:conversations(*)")
        .eq("user_id", currentUserId);

      if (partError) throw partError;
      if (!myParticipants) return;

      const conversationsData: Conversation[] = [];

      for (const participant of myParticipants) {
        const convId = participant.conversation_id;

        const { data: otherPart } = await supabase
          .from("conversation_participants")
          .select("user_id")
          .eq("conversation_id", convId)
          .neq("user_id", currentUserId)
          .maybeSingle();

        if (!otherPart) continue;

        const { data: profile } = await supabase
          .from("profiles")
          .select("id, user_id, display_name, handle, avatar_url")
          .eq("user_id", otherPart.user_id)
          .maybeSingle();

        if (!profile) continue;

        const { data: lastMsg } = await supabase
          .from("messages")
          .select("content, created_at")
          .eq("conversation_id", convId)
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        conversationsData.push({
          id: convId,
          created_at: participant.conversation?.created_at || new Date().toISOString(),
          updated_at: participant.conversation?.updated_at || new Date().toISOString(),
          other_user: {
            id: profile.id,
            user_id: profile.user_id,
            display_name: profile.display_name,
            handle: profile.handle,
            avatar_url: profile.avatar_url
          },
          last_message: lastMsg || null
        });
      }

      setConversations(conversationsData);
    } catch (error: any) {
      toast({
        title: "Error loading conversations",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const fetchMessages = async (conversationId: string) => {
    const { data } = await supabase
      .from("messages")
      .select("id, content, sender_id, created_at")
      .eq("conversation_id", conversationId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true });

    if (data) {
      // Get sender names
      const messagesWithNames = await Promise.all(
        data.map(async (msg) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("user_id", msg.sender_id)
            .single();

          return {
            ...msg,
            sender_name: profile?.display_name || "Unknown"
          };
        })
      );

      setMessages(messagesWithNames);
    }
  };

  const subscribeToMessages = (conversationId: string) => {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("user_id", payload.new.sender_id)
            .single();

          setMessages(prev => [...prev, {
            ...payload.new,
            sender_name: profile?.display_name || "Unknown"
          } as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !currentUserId) return;

    try {
      const { error } = await supabase
        .from("messages")
        .insert({
          conversation_id: selectedConversation,
          sender_id: currentUserId,
          content: newMessage.trim()
        });

      if (error) throw error;

      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", selectedConversation);

      setNewMessage("");
      fetchConversations();
    } catch (error: any) {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-32 text-center">Loading...</div>
      </div>
    );
  }

  if (!currentUserId) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-32 text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to view messages</h1>
        </div>
      </div>
    );
  }

  const selectedConv = conversations.find(c => c.id === selectedConversation);

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="pt-20 pb-8 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Messages</h1>
          
          <div className="grid md:grid-cols-3 gap-6 h-[600px]">
            {/* Conversations List */}
            <div className="glass-card rounded-2xl p-4 overflow-hidden flex flex-col">
              <h2 className="font-semibold mb-3">Conversations</h2>
              
              <div className="space-y-3 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={sortBy} onValueChange={(v: "recent" | "name") => setSortBy(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Most Recent</SelectItem>
                    <SelectItem value="name">Alphabetical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <ScrollArea className="flex-1">
                {filteredConversations.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">
                    {searchTerm ? "No conversations found" : "No conversations yet"}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {filteredConversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => setSelectedConversation(conv.id)}
                        className={`w-full p-3 rounded-lg text-left transition-all ${
                          selectedConversation === conv.id
                            ? 'bg-primary/10 border border-primary/20 shadow-sm'
                            : 'hover:bg-accent/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                            {conv.other_user?.avatar_url ? (
                              <img src={conv.other_user.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-5 h-5" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{conv.other_user?.display_name}</p>
                            {conv.last_message && (
                              <p className="text-sm text-muted-foreground truncate">
                                {conv.last_message.content}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Messages Area */}
            <div className="md:col-span-2 glass-card rounded-2xl p-4 flex flex-col">
              {selectedConv ? (
                <>
                  {/* Header */}
                  <div className="flex items-center gap-3 pb-4 border-b">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                      {selectedConv.other_user?.avatar_url ? (
                        <img src={selectedConv.other_user.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">{selectedConv.other_user?.display_name}</p>
                      <p className="text-sm text-muted-foreground">@{selectedConv.other_user?.handle}</p>
                    </div>
                  </div>

                  {/* Messages */}
                  <ScrollArea className="flex-1 py-4">
                    <div className="space-y-4">
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                              msg.sender_id === currentUserId
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <p>{msg.content}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  {/* Input */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Type a message..."
                      className="flex-1"
                    />
                    <Button onClick={sendMessage} size="icon">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  Select a conversation to start messaging
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Messages;