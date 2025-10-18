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
      toast({ title: "Account created!", description: "You're all set—no email verification needed.", duration: 6000 });
      setTimeout(() => navigate("/onboarding"), 800);
    }

    setLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("signin-email") as string;
    const password = formData.get("signin-password") as string;

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast({ 
        title: "Error signing in", 
        description: getAuthErrorMessage(error), 
        variant: "destructive" 
      });
    } else {
      toast({ title: "Welcome back!" });
      navigate("/settings");
    }

    setLoading(false);
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
