import { useState } from "react";
import { Navbar } from "@/components/Navbar";
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
              Direct Messages (Coming Soon)
            </h1>
          </div>

            <div className="h-[calc(100vh-200px)] flex items-center justify-center">
              <div className="text-center max-w-md">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h2 className="text-2xl font-semibold mb-2">Private chat is on the way</h2>
                <p className="text-muted-foreground">
                  We’re building a safe, real‑time messaging experience. Check back soon!
                </p>
              </div>
            </div>
        </div>
      </main>
    </div>
  );
};

export default Messages;
