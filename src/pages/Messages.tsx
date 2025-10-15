import { Navbar } from "@/components/Navbar";
import { MessageCircle, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";

const Messages = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
              <MessageCircle className="w-10 h-10" />
              Messages
            </h1>
          </div>

          <Card className="glass-card p-12 text-center">
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                <Clock className="w-12 h-12 text-primary" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-3xl font-bold">Coming Soon</h2>
                <p className="text-muted-foreground text-lg max-w-md">
                  We're working hard to bring you an amazing messaging experience. 
                  Direct messaging will be available soon!
                </p>
              </div>

              <div className="pt-4 space-y-2 text-sm text-muted-foreground">
                <p className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  Real-time messaging
                </p>
                <p className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  File sharing
                </p>
                <p className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  Message notifications
                </p>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Messages;
