import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { Mail, RefreshCw } from "lucide-react";

const VerifyEmail = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sending, setSending] = useState(false);

  const handleResendEmail = async () => {
    setSending(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user?.email) {
      toast({
        title: "Error",
        description: "No email found. Please sign up again.",
        variant: "destructive"
      });
      navigate("/auth");
      return;
    }

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: user.email,
    });

    if (error) {
      toast({
        title: "Error",
        description: "Unable to resend email. Please try again later.",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Email sent!",
        description: "Please check your inbox for the verification link.",
      });
    }

    setSending(false);
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="pt-32 pb-20 px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="glass-card rounded-2xl p-8">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            
            <h1 className="text-3xl font-bold mb-4">Check your email</h1>
            
            <p className="text-muted-foreground mb-6">
              We've sent you a verification link. Please check your inbox and click the link to verify your email address.
            </p>
            
            <div className="bg-muted/30 rounded-lg p-4 mb-6">
              <p className="text-sm text-muted-foreground">
                Don't see the email? Check your spam folder or request a new one below.
              </p>
            </div>

            <Button
              onClick={handleResendEmail}
              disabled={sending}
              variant="outline"
              className="w-full"
            >
              {sending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Resend verification email
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default VerifyEmail;
