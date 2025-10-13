import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";

const Onboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/login");
      } else {
        setUserId(session.user.id);
      }
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userId) return;
    
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    const handle = formData.get("handle") as string;
    const displayName = formData.get("displayName") as string;
    const introUrl = formData.get("introUrl") as string;
    const primaryCta = formData.get("primaryCta") as string;
    const primaryCtaUrl = formData.get("primaryCtaUrl") as string;
    const hireable = formData.get("hireable") === "on";

    const { error } = await supabase
      .from("profiles")
      .update({
        handle,
        display_name: displayName,
        intro_url: introUrl || null,
        primary_cta: primaryCta || null,
        primary_cta_url: primaryCtaUrl || null,
        hireable,
      })
      .eq("user_id", userId);

    if (error) {
      toast({ title: "Error updating profile", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile created successfully!" });
      navigate("/settings");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="pt-32 pb-20 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">Welcome to Miryn!</h1>
            <p className="text-muted-foreground">Let's set up your profile</p>
          </div>

          <div className="glass-card rounded-2xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="handle">Handle (username) *</Label>
                <Input
                  id="handle"
                  name="handle"
                  placeholder="your-handle"
                  required
                  pattern="[a-z0-9-]{3,20}"
                  title="3-20 characters, lowercase letters, numbers, and hyphens only"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Your profile will be at miryn.app/{"{handle}"}
                </p>
              </div>

              <div>
                <Label htmlFor="displayName">Display Name *</Label>
                <Input
                  id="displayName"
                  name="displayName"
                  placeholder="Your Name"
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="introUrl">Intro Video URL</Label>
                <Input
                  id="introUrl"
                  name="introUrl"
                  type="url"
                  placeholder="https://youtube.com/..."
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="primaryCta">Primary CTA Type</Label>
                <Select name="primaryCta">
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hire">Hire me</SelectItem>
                    <SelectItem value="invite_bot">Invite to collaborate</SelectItem>
                    <SelectItem value="contact">Contact</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="primaryCtaUrl">CTA URL</Label>
                <Input
                  id="primaryCtaUrl"
                  name="primaryCtaUrl"
                  type="url"
                  placeholder="https://..."
                  className="mt-1"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="hireable" name="hireable" />
                <Label htmlFor="hireable" className="cursor-pointer">
                  I'm available for hire
                </Label>
              </div>

              <Button type="submit" className="w-full btn-hero" disabled={loading}>
                {loading ? "Creating profile..." : "Complete Setup"}
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Onboarding;
