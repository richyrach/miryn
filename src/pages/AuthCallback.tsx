import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AuthCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Complete OAuth/email verification by exchanging code for a session if present
        try {
          await supabase.auth.exchangeCodeForSession(window.location.href);
        } catch (exchangeErr) {
          console.warn('Auth callback: no code to exchange or already exchanged', exchangeErr);
        }

        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (!session) {
          toast({
            title: "Authentication failed",
            description: "Please try signing in again.",
            variant: "destructive",
          });
          navigate("/auth");
          return;
        }

        // Check if user has a profile
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("handle, account_type")
          .eq("user_id", session.user.id)
          .single();

        if (profileError && profileError.code !== "PGRST116") {
          throw profileError;
        }

        // If no profile or placeholder handle, user is new
        const isNewUser = !profile || profile.handle?.startsWith("temp_");

        if (isNewUser) {
          // New user - go to account type selection
          navigate("/onboarding");
        } else {
          // Returning user - go to settings
          toast({ title: "Welcome back!" });
          navigate("/settings");
        }
      } catch (error) {
        console.error("OAuth callback error:", error);
        toast({
          title: "Error",
          description: "Something went wrong. Please try again.",
          variant: "destructive",
        });
        navigate("/auth");
      }
    };

    handleCallback();
  }, [navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
