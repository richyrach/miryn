import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { ConversationList } from "@/components/ConversationList";
import { ChatWindow } from "@/components/ChatWindow";
import { MessageCircle } from "lucide-react";
import { Card } from "@/components/ui/card";

const Messages = () => {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="pt-20 pb-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <MessageCircle className="w-8 h-8" />
              Messages
            </h1>
          </div>

          <Card className="h-[calc(100vh-200px)] flex overflow-hidden">
            {/* Conversation List */}
            <div className="w-80 border-r">
              <ConversationList
                onSelectConversation={setSelectedConversation}
                selectedConversationId={selectedConversation}
              />
            </div>

            {/* Chat Window */}
            <div className="flex-1">
              {selectedConversation ? (
                <ChatWindow conversationId={selectedConversation} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <MessageCircle className="w-16 h-16 text-muted-foreground mb-4" />
                  <h2 className="text-2xl font-semibold mb-2">Your Messages</h2>
                  <p className="text-muted-foreground max-w-md">
                    Select a conversation from the list to start chatting, or visit someone's profile to send them a message.
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Messages;
