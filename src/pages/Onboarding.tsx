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
import { z } from "zod";

const onboardingSchema = z.object({
  handle: z.string().trim().min(3, "Username must be at least 3 characters").max(20, "Username must be at most 20 characters").regex(/^[a-z0-9]+$/, "Username can only contain lowercase letters and numbers"),
  display_name: z.string().trim().min(1, "Display name is required").max(100, "Display name must be less than 100 characters"),
  intro_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  primary_cta_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

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

    // Validate input
    const validationResult = onboardingSchema.safeParse({
      handle,
      display_name: displayName,
      intro_url: introUrl || undefined,
      primary_cta_url: primaryCtaUrl || undefined,
    });

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(", ");
      toast({ 
        title: "Validation Error", 
        description: errors, 
        variant: "destructive" 
      });
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        handle: validationResult.data.handle,
        display_name: validationResult.data.display_name,
        intro_url: validationResult.data.intro_url || null,
        primary_cta: primaryCta || null,
        primary_cta_url: validationResult.data.primary_cta_url || null,
        hireable,
      })
      .eq("user_id", userId);

    if (error) {
      toast({ title: "Error updating profile", description: "Unable to update profile. Please try again.", variant: "destructive" });
    } else {
      toast({ title: "Profile created successfully!" });
      navigate("/settings");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="pt-32 pb-20 px-4 animate-fade-in">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">Welcome to Miryn!</h1>
            <p className="text-muted-foreground">Let's set up your profile</p>
          </div>

          <div className="glass-card rounded-2xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="handle">Username *</Label>
                <Input
                  id="handle"
                  name="handle"
                  placeholder="username123"
                  required
                  pattern="[a-z0-9]{3,20}"
                  title="3-20 characters, lowercase letters and numbers only"
                  className="mt-1"
                  maxLength={20}
                  onChange={(e) => {
                    e.target.value = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '');
                  }}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Your profile will be at miryn.app/@{"{username}"}. Only lowercase letters and numbers.
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
                <Label htmlFor="primaryCta">Main Action Button</Label>
                <Select name="primaryCta">
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="What should your profile button do?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hire">Hire me</SelectItem>
                    <SelectItem value="invite_bot">Invite to collaborate</SelectItem>
                    <SelectItem value="contact">Contact</SelectItem>
                    <SelectItem value="custom">Custom action</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  This button will appear on your profile
                </p>
              </div>

              <div>
                <Label htmlFor="primaryCtaUrl">Button Link</Label>
                <Input
                  id="primaryCtaUrl"
                  name="primaryCtaUrl"
                  type="url"
                  placeholder="https://calendly.com/yourname or https://yoursite.com/contact"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Where should the button take people? (e.g., your booking page, contact form)
                </p>
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
