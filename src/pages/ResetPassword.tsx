import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { KeyRound } from "lucide-react";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth`,
    });

    if (error) {
      toast({
        title: "Error",
        description: "Unable to send reset email. Please try again.",
        variant: "destructive"
      });
    } else {
      setEmailSent(true);
      toast({
        title: "Check your email",
        description: "We've sent you a password reset link.",
      });
    }

    setLoading(false);
  };

  if (emailSent) {
    return (
      <div className="min-h-screen">
        <Navbar />
        
        <main className="pt-32 pb-20 px-4">
          <div className="max-w-md mx-auto text-center">
            <div className="glass-card rounded-2xl p-8">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                <KeyRound className="w-8 h-8 text-primary" />
              </div>
              
              <h1 className="text-3xl font-bold mb-4">Check your email</h1>
              
              <p className="text-muted-foreground mb-6">
                We've sent you a password reset link. Please check your inbox and follow the instructions.
              </p>

              <Button onClick={() => navigate("/auth")} className="w-full">
                Back to Sign In
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="pt-32 pb-20 px-4">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">Reset Password</h1>
            <p className="text-muted-foreground">Enter your email to receive a reset link</p>
          </div>

          <div className="glass-card rounded-2xl p-8">
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  className="mt-1"
                />
              </div>

              <Button type="submit" className="w-full btn-hero" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => navigate("/auth")}
              >
                Back to Sign In
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ResetPassword;
