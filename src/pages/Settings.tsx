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
import { Check } from "lucide-react";

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
    const skillsInput = formData.get("skills") as string;
    
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: formData.get("displayName") as string,
        bio: (formData.get("bio") as string) || null,
        location: (formData.get("location") as string) || null,
        skills: skillsInput ? skillsInput.split(",").map(s => s.trim()) : [],
        intro_url: (formData.get("introUrl") as string) || null,
        primary_cta: (formData.get("primaryCta") as string) || null,
        primary_cta_url: (formData.get("primaryCtaUrl") as string) || null,
        hireable: formData.get("hireable") === "on",
      })
      .eq("user_id", userId);

    if (error) {
      toast({ title: "Error updating profile", description: error.message, variant: "destructive" });
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
