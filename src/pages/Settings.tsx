import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { z } from "zod";
import { Check } from "lucide-react";

const profileSchema = z.object({
  display_name: z.string().trim().min(1, "Display name is required").max(100, "Display name must be less than 100 characters"),
  bio: z.string().trim().max(500, "Bio must be less than 500 characters").optional(),
  location: z.string().trim().max(100, "Location must be less than 100 characters").optional(),
  skills: z.array(z.string().trim().max(50, "Each skill must be less than 50 characters")).max(20, "Maximum 20 skills allowed"),
  intro_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  primary_cta_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/login");
      } else {
        setUserId(session.user.id);
        fetchProfile(session.user.id);
      }
    });
  }, [navigate]);

  const fetchProfile = async (uid: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", uid)
      .single();
    
    if (data) {
      setProfile(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userId) return;
    
    setLoading(true);
    setSaved(false);
    
    const formData = new FormData(e.currentTarget);
    
    const displayName = formData.get("displayName") as string;
    const bio = formData.get("bio") as string;
    const location = formData.get("location") as string;
    const skillsInput = formData.get("skills") as string;
    const skills = skillsInput ? skillsInput.split(",").map((s) => s.trim()).filter(Boolean) : [];
    const introUrl = formData.get("introUrl") as string;
    const primaryCta = formData.get("primaryCta") as string;
    const primaryCtaUrl = formData.get("primaryCtaUrl") as string;
    const hireable = formData.get("hireable") === "on";

    // Validate input
    const validationResult = profileSchema.safeParse({
      display_name: displayName,
      bio: bio || undefined,
      location: location || undefined,
      skills,
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
        display_name: validationResult.data.display_name,
        bio: validationResult.data.bio || null,
        location: validationResult.data.location || null,
        skills: validationResult.data.skills,
        intro_url: validationResult.data.intro_url || null,
        primary_cta: primaryCta || null,
        primary_cta_url: validationResult.data.primary_cta_url || null,
        hireable,
      })
      .eq("user_id", userId);

    if (error) {
      toast({ title: "Error updating profile", description: "Unable to update profile. Please try again.", variant: "destructive" });
    } else {
      setSaved(true);
      toast({ title: "Profile updated successfully!" });
      setTimeout(() => setSaved(false), 3000);
    }

    setLoading(false);
  };

  if (!profile) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-32 text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="pt-32 pb-20 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Profile Settings</h1>
            <p className="text-muted-foreground">
              Your profile is live at: <span className="text-primary">/{profile.handle}</span>
            </p>
          </div>

          <div className="glass-card rounded-2xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="handle">Handle</Label>
                <Input
                  id="handle"
                  value={profile.handle}
                  disabled
                  className="mt-1 opacity-60"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Handle cannot be changed after creation
                </p>
              </div>

              <div>
                <Label htmlFor="displayName">Display Name *</Label>
                <Input
                  id="displayName"
                  name="displayName"
                  defaultValue={profile.display_name}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  defaultValue={profile.bio || ""}
                  placeholder="Tell us about yourself..."
                  className="mt-1 min-h-24"
                />
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  defaultValue={profile.location || ""}
                  placeholder="e.g., San Francisco, CA"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="skills">Skills (comma-separated)</Label>
                <Input
                  id="skills"
                  name="skills"
                  defaultValue={profile.skills?.join(", ") || ""}
                  placeholder="React, TypeScript, Design..."
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="introUrl">Intro Video URL</Label>
                <Input
                  id="introUrl"
                  name="introUrl"
                  type="url"
                  defaultValue={profile.intro_url || ""}
                  placeholder="https://youtube.com/..."
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="primaryCta">Primary CTA Type</Label>
                <Select name="primaryCta" defaultValue={profile.primary_cta || ""}>
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
                  defaultValue={profile.primary_cta_url || ""}
                  placeholder="https://..."
                  className="mt-1"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hireable"
                  name="hireable"
                  defaultChecked={profile.hireable}
                />
                <Label htmlFor="hireable" className="cursor-pointer">
                  I'm available for hire
                </Label>
              </div>

              <Button type="submit" className="w-full btn-hero" disabled={loading}>
                {loading ? "Saving..." : saved ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Saved!
                  </>
                ) : "Save Changes"}
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
