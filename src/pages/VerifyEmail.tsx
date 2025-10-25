import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { Mail, RefreshCw, KeyRound } from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

const RESEND_COOLDOWN = 60; // 60 seconds

const VerifyEmail = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const [email, setEmail] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setEmail(user.email);
        
        // Check if user is already verified
        if (user.email_confirmed_at) {
          navigate("/onboarding");
        }
      } else {
        navigate("/auth");
      }
    };
    fetchUser();

    // Listen for auth state changes to catch email verification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user?.email_confirmed_at) {
        navigate("/onboarding");
      }
    });

    return () => subscription.unsubscribe();

    // Check for existing cooldown
    const lastSent = localStorage.getItem("email_verification_last_sent");
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
        description: "No email found. Please sign up again.",
        variant: "destructive"
      });
      navigate("/auth");
      return;
    }

    // Call edge function to check rate limit
    const { data: rateLimitData, error: rateLimitError } = await supabase.functions.invoke(
      'check-email-rate-limit',
      {
        body: { emailType: 'verification' }
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
      
      // Set cooldown
      localStorage.setItem("email_verification_last_sent", Date.now().toString());
      setCountdown(RESEND_COOLDOWN);
    }

    setSending(false);
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast({
        title: "Invalid code",
        description: "Please enter the 6-digit code from your email.",
        variant: "destructive"
      });
      return;
    }

    setVerifying(true);
    
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email'
    });

    if (error) {
      toast({
        title: "Verification failed",
        description: error.message || "Invalid or expired code. Please try again.",
        variant: "destructive"
      });
      setOtp("");
    } else {
      toast({
        title: "Email verified!",
        description: "Redirecting to onboarding...",
      });
      setTimeout(() => navigate("/onboarding"), 1000);
    }

    setVerifying(false);
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
              We've sent a verification link to:
            </p>
            
            <div className="bg-primary/10 rounded-lg p-3 mb-6">
              <p className="text-sm font-medium">{email}</p>
            </div>
            
            <p className="text-muted-foreground text-sm mb-6">
              Please check your inbox and click the link to verify your email address.
            </p>
            
            <div className="bg-muted/30 rounded-lg p-4 mb-6">
              <p className="text-sm text-muted-foreground mb-4">
                Don't see the email? Check your spam folder or request a new one below.
              </p>
              
              <div className="border-t border-border pt-4">
                <p className="text-sm font-medium mb-3 flex items-center justify-center gap-2">
                  <KeyRound className="w-4 h-4" />
                  Or enter the 6-digit code from your email
                </p>
                
                <div className="flex flex-col items-center gap-3">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={setOtp}
                    disabled={verifying}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                  
                  <Button
                    onClick={handleVerifyOtp}
                    disabled={verifying || otp.length !== 6}
                    className="w-full"
                  >
                    {verifying ? "Verifying..." : "Verify Code"}
                  </Button>
                </div>
              </div>
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
