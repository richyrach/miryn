import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Palette, Search, ArrowRight } from "lucide-react";

const AccountTypeSelection = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSelectType = async (accountType: 'professional' | 'basic') => {
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "Please sign in again.",
          variant: "destructive"
        });
        navigate("/auth");
        return;
      }

      // Wait for or create profile if missing
      let retries = 0;
      let profileExists = false;
      
      while (retries < 5 && !profileExists) {
        const { data: profile, error: fetchError } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (profile && !fetchError) {
          profileExists = true;
        } else {
          await new Promise((resolve) => setTimeout(resolve, 400));
          retries++;
        }
      }

      if (!profileExists) {
        // Create minimal profile as fallback (no trigger available yet)
        const placeholderHandle = `temp_${user.id.substring(0, 12)}`;
        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert(
            {
              user_id: user.id,
              handle: placeholderHandle,
              display_name: 'New User',
              account_type: accountType,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          );

        if (upsertError) {
          toast({
            title: 'Profile Not Ready',
            description: 'We could not create your profile yet. Please try again in a moment.',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }
      }

      // Update profile with account type
      const { error } = await supabase
        .from('profiles')
        .update({ 
          account_type: accountType,
          professional_enabled_at: accountType === 'professional' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Account type set to ${accountType === 'professional' ? 'Creator' : 'Hire'}`
      });

      // Redirect to onboarding
      navigate("/onboarding");

    } catch (error) {
      console.error("Error setting account type:", error);
      toast({
        title: "Error",
        description: "Failed to set account type. Please try again.",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "Please sign in again.",
          variant: "destructive"
        });
        navigate("/auth");
        return;
      }

      // Wait for or create profile if missing
      let retries = 0;
      let profileExists = false;
      
      while (retries < 5 && !profileExists) {
        const { data: profile, error: fetchError } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (profile && !fetchError) {
          profileExists = true;
        } else {
          await new Promise((resolve) => setTimeout(resolve, 400));
          retries++;
        }
      }

      if (!profileExists) {
        // Create minimal profile as fallback (no trigger available yet)
        const placeholderHandle = `temp_${user.id.substring(0, 12)}`;
        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert(
            {
              user_id: user.id,
              handle: placeholderHandle,
              display_name: 'New User',
              account_type: 'basic',
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          );

        if (upsertError) {
          toast({
            title: 'Profile Not Ready',
            description: 'We could not create your profile yet. Please try again in a moment.',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }
      }

      // Set as basic by default
      const { error } = await supabase
        .from('profiles')
        .update({ 
          account_type: 'basic',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      navigate("/onboarding");
    } catch (error) {
      console.error("Error skipping:", error);
      toast({
        title: "Error",
        description: "Failed to proceed. Please try again.",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Welcome to Miryn!
            </h1>
            <p className="text-lg text-muted-foreground">
              How will you use the platform?
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Professional/Creator Option */}
            <button
              onClick={() => handleSelectType('professional')}
              disabled={loading}
              className="group relative overflow-hidden rounded-2xl border-2 border-border hover:border-primary/50 transition-all duration-300 p-8 text-left bg-card hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full -z-10" />
              
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Palette className="w-7 h-7 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">
                    I'm a Creator
                  </h2>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Build your portfolio, showcase projects, offer services, and get hired by clients
                  </p>
                </div>
              </div>

              <ul className="space-y-2 mb-6 text-sm">
                <li className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Full portfolio with projects & case studies
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Offer services and receive requests
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Advanced profile customization
                </li>
              </ul>

              <div className="flex items-center gap-2 text-primary font-medium group-hover:gap-3 transition-all">
                Get Started <ArrowRight className="w-4 h-4" />
              </div>
            </button>

            {/* Basic/Client Option */}
            <button
              onClick={() => handleSelectType('basic')}
              disabled={loading}
              className="group relative overflow-hidden rounded-2xl border-2 border-border hover:border-primary/50 transition-all duration-300 p-8 text-left bg-card hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full -z-10" />
              
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Search className="w-7 h-7 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">
                    I'm looking to Hire
                  </h2>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Browse portfolios, find talent, and hire the perfect person for your project
                  </p>
                </div>
              </div>

              <ul className="space-y-2 mb-6 text-sm">
                <li className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Discover talented creators
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Request services and collaborate
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Simple, streamlined experience
                </li>
              </ul>

              <div className="flex items-center gap-2 text-primary font-medium group-hover:gap-3 transition-all">
                Get Started <ArrowRight className="w-4 h-4" />
              </div>
            </button>
          </div>

          <div className="text-center">
            <Button
              onClick={handleSkip}
              variant="ghost"
              disabled={loading}
              className="text-muted-foreground hover:text-foreground"
            >
              {loading ? "Processing..." : "I'll decide later"}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              You can always change this in your settings
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AccountTypeSelection;
