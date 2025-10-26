import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { Mail, RefreshCw } from "lucide-react";

const RESEND_COOLDOWN = 60; // 60 seconds

const VerifyEmail = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const [email, setEmail] = useState("");
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setEmail(user.email);
      } else {
        // If no user session, this page is for password reset context
        navigate("/auth");
      }
    };
    fetchUser();

    // Check for existing cooldown
    const lastSent = localStorage.getItem("password_reset_last_sent");
    if (lastSent) {
      const elapsed = Math.floor((Date.now() - parseInt(lastSent)) / 1000);
      if (elapsed < RESEND_COOLDOWN) {
        setCountdown(RESEND_COOLDOWN - elapsed);
      }
    }
  }, [navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResendEmail = async () => {
    if (countdown > 0) return;

    setSending(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user?.email) {
      toast({
        title: "Error",
        description: "No email found. Please sign in again.",
        variant: "destructive"
      });
      navigate("/auth");
      return;
    }

    // Call edge function to check rate limit
    const { data: rateLimitData, error: rateLimitError } = await supabase.functions.invoke(
      'check-email-rate-limit',
      {
        body: { emailType: 'password_reset' }
      }
    );

    if (rateLimitError || !rateLimitData?.allowed) {
      toast({
        title: "Too many requests",
        description: rateLimitData?.message || "Please wait before requesting another email.",
        variant: "destructive"
      });
      setSending(false);
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/reset-password`
    });

    if (error) {
      toast({
        title: "Error",
        description: "Unable to send reset email. Please try again later.",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Email sent!",
        description: "Please check your inbox for the password reset link.",
      });
      
      // Set cooldown
      localStorage.setItem("password_reset_last_sent", Date.now().toString());
      setCountdown(RESEND_COOLDOWN);
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
            
            <p className="text-muted-foreground mb-4">
              We've sent a password reset link to:
            </p>
            
            <div className="bg-primary/10 rounded-lg p-3 mb-6">
              <p className="text-sm font-medium">{email}</p>
            </div>
            
            <p className="text-muted-foreground text-sm mb-6">
              Please check your inbox and click the link to reset your password.
            </p>
            
            <div className="bg-muted/30 rounded-lg p-4 mb-6">
              <p className="text-sm text-muted-foreground">
                Don't see the email? Check your spam folder or request a new one below.
              </p>
            </div>

            <Button
              onClick={handleResendEmail}
              disabled={sending || countdown > 0}
              variant="outline"
              className="w-full"
            >
              {sending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : countdown > 0 ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Resend in {countdown}s
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
