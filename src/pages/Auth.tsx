import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { getAuthErrorMessage } from "@/lib/errorMessages";

const Auth = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/settings");
      }
    });
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("signup-email") as string;
    const password = formData.get("signup-password") as string;
    const username = formData.get("username") as string;

    if (!email || !password || !username) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/onboarding`,
        data: { username },
      },
    });

    if (error) {
      toast({ 
        title: "Error signing up", 
        description: getAuthErrorMessage(error), 
        variant: "destructive" 
      });
    } else {
      toast({ 
        title: "Account created!", 
        description: "Welcome to Miryn! Let's set up your profile.", 
        duration: 3000 
      });
      setTimeout(() => navigate("/account-type"), 500);
    }

    setLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("signin-email") as string;
    const password = formData.get("signin-password") as string;

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast({ 
        title: "Error signing in", 
        description: getAuthErrorMessage(error), 
        variant: "destructive" 
      });
    } else {
      // Check if MFA is required
      const factors = await supabase.auth.mfa.listFactors();
      if (factors.data?.totp && factors.data.totp.length > 0) {
        navigate("/verify-mfa", { state: { from: "/settings" } });
      } else {
        toast({ title: "Welcome back!" });
        navigate("/settings");
      }
    }

    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        toast({
          title: "Error",
          description: getAuthErrorMessage(error),
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start Google sign-in",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="pt-32 pb-20 px-4">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">Welcome to Miryn</h1>
            <p className="text-muted-foreground">Create your account or sign in to continue</p>
          </div>

          <div className="glass-card rounded-2xl p-8">
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <Button
                    type="button"
                    onClick={handleGoogleSignIn}
                    variant="outline"
                    className="w-full h-11 bg-background hover:bg-accent"
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </Button>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      name="signin-email"
                      type="email"
                      placeholder="you@example.com"
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label htmlFor="signin-password">Password</Label>
                      <Link to="/reset-password" className="text-xs text-primary hover:underline">
                        Forgot password?
                      </Link>
                    </div>
                    <Input
                      id="signin-password"
                      name="signin-password"
                      type="password"
                      required
                      className="mt-1"
                    />
                  </div>
                  <Button type="submit" className="w-full btn-hero" disabled={loading}>
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                  <div className="mt-4 text-center">
                    <Link to="/recover-account" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      Forgot your username?
                    </Link>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <Button
                    type="button"
                    onClick={handleGoogleSignIn}
                    variant="outline"
                    className="w-full h-11 bg-background hover:bg-accent"
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </Button>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="username">{t('auth.username')}</Label>
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      placeholder="johndoe"
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      name="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      name="signup-password"
                      type="password"
                      required
                      className="mt-1"
                      minLength={8}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      At least 8 characters
                    </p>
                  </div>
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 border border-border/40">
                    <input
                      type="checkbox"
                      id="age-confirmation"
                      name="age-confirmation"
                      required
                      className="mt-1"
                    />
                    <label htmlFor="age-confirmation" className="text-xs text-muted-foreground cursor-pointer">
                      I confirm I am 13 years of age or older (16+ for EU users). By signing up, I agree to Miryn's{" "}
                      <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link> and{" "}
                      <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
                    </label>
                  </div>
                  <Button type="submit" className="w-full btn-hero" disabled={loading}>
                    {loading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Auth;
