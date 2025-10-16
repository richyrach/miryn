import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { ConversationList } from "@/components/ConversationList";
import { ChatWindow } from "@/components/ChatWindow";
import { MessageCircle } from "lucide-react";

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

          <div className="grid md:grid-cols-[350px_1fr] gap-4 h-[calc(100vh-200px)]">
            {/* Conversations List */}
            <div className="border rounded-lg overflow-hidden bg-card">
              <ConversationList
                onSelectConversation={setSelectedConversation}
                selectedConversationId={selectedConversation}
              />
            </div>

            {/* Chat Window */}
            <div className="border rounded-lg overflow-hidden bg-card">
              {selectedConversation ? (
                <ChatWindow conversationId={selectedConversation} />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
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
