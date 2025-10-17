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
import { Check, Upload, User, Image as ImageIcon, Mail } from "lucide-react";
import { useRef } from "react";
import { getDatabaseErrorMessage, getAuthErrorMessage } from "@/lib/errorMessages";
import { SocialLinksManager } from "@/components/SocialLinksManager";
import { CustomLinksManager } from "@/components/CustomLinksManager";
import { PrivacySettings } from "@/components/PrivacySettings";
import { LanguageSelector } from "@/components/LanguageSelector";

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
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [currentEmail, setCurrentEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const bannerInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/login");
      } else {
        setUserId(session.user.id);
        setCurrentEmail(session.user.email || "");
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
      if (data.avatar_url) setAvatarPreview(data.avatar_url);
      if (data.banner_url) setBannerPreview(data.banner_url);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadFile = async (file: File, bucket: string, path: string) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true });
    
    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return publicUrl;
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

    try {
      let avatarUrl = profile.avatar_url;
      let bannerUrl = profile.banner_url;

      // Upload avatar if changed
      if (avatarFile) {
        const avatarPath = `${userId}/avatar-${Date.now()}.${avatarFile.name.split('.').pop()}`;
        avatarUrl = await uploadFile(avatarFile, 'avatars', avatarPath);
      }

      // Upload banner if changed
      if (bannerFile) {
        const bannerPath = `${userId}/banner-${Date.now()}.${bannerFile.name.split('.').pop()}`;
        bannerUrl = await uploadFile(bannerFile, 'banners', bannerPath);
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
          avatar_url: avatarUrl,
          banner_url: bannerUrl,
        })
        .eq("user_id", userId);

      if (error) throw error;

      setSaved(true);
      toast({ title: "Profile updated successfully!" });
      setTimeout(() => setSaved(false), 3000);
      fetchProfile(userId);
    } catch (error: any) {
      toast({ 
        title: "Error updating profile", 
        description: getDatabaseErrorMessage(error), 
        variant: "destructive" 
      });
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
              {/* Banner Upload */}
              <div>
                <Label>Profile Banner</Label>
                <div className="mt-2 relative h-48 rounded-xl overflow-hidden bg-muted border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 transition-colors cursor-pointer group" onClick={() => bannerInputRef.current?.click()}>
                  {bannerPreview ? (
                    <img src={bannerPreview} alt="Banner preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                      <ImageIcon className="w-12 h-12 mb-2" />
                      <p className="text-sm">Click to upload banner</p>
                    </div>
                  )}
                  <input
                    ref={bannerInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleBannerChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Upload className="w-8 h-8 text-white" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Recommended: 1500x500px, max 10MB
                </p>
              </div>

              {/* Avatar Upload */}
              <div>
                <Label>Profile Picture</Label>
                <div className="mt-2 flex items-center gap-4">
                  <div className="relative w-24 h-24 rounded-full overflow-hidden bg-muted border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 transition-colors cursor-pointer group" onClick={() => avatarInputRef.current?.click()}>
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                        <User className="w-8 h-8" />
                      </div>
                    )}
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Upload className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">
                      Click to upload a new profile picture
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Recommended: 400x400px, max 5MB
                    </p>
                  </div>
                </div>
              </div>

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

          <div className="glass-card rounded-2xl p-8 mt-8">
            <h2 className="text-2xl font-semibold mb-4">Change Password</h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!userId) return;
                if (newPassword !== confirmPassword) {
                  toast({ title: "Passwords do not match", variant: "destructive" });
                  return;
                }
                if (newPassword.length < 12) {
                  toast({ title: "Password too short", description: "Use at least 12 characters.", variant: "destructive" });
                  return;
                }
                try {
                  setPwLoading(true);
                  const { error } = await supabase.auth.updateUser({ password: newPassword });
                  if (error) throw error;
                  toast({ title: "Password updated" });
                  setNewPassword("");
                  setConfirmPassword("");
                } catch (err: any) {
                  toast({ title: "Error updating password", description: getDatabaseErrorMessage(err), variant: "destructive" });
                } finally {
                  setPwLoading(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={12}
                  required
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  12+ chars, include upper, lower, number, special.
                </p>
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
              <Button type="submit" className="w-full" disabled={pwLoading}>
                {pwLoading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </div>

          <div className="glass-card rounded-2xl p-8 mt-8">
            <h2 className="text-2xl font-semibold mb-4">Change Email Address</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Update your email address. You'll need to verify the new email before the change is complete.
            </p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!userId) return;
                
                // Validate new email
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(newEmail)) {
                  toast({ title: "Invalid email", description: "Please enter a valid email address", variant: "destructive" });
                  return;
                }

                if (newEmail === currentEmail) {
                  toast({ title: "Same email", description: "New email must be different from current email", variant: "destructive" });
                  return;
                }

                if (!emailPassword) {
                  toast({ title: "Password required", description: "Please enter your current password to confirm", variant: "destructive" });
                  return;
                }

                try {
                  setEmailLoading(true);
                  
                  // Verify current password first
                  const { error: signInError } = await supabase.auth.signInWithPassword({
                    email: currentEmail,
                    password: emailPassword,
                  });

                  if (signInError) {
                    toast({ 
                      title: "Invalid password", 
                      description: "Please enter your correct current password", 
                      variant: "destructive" 
                    });
                    setEmailLoading(false);
                    return;
                  }

                  // Update email
                  const { error } = await supabase.auth.updateUser({ 
                    email: newEmail 
                  });

                  if (error) throw error;

                  // Send notification to old email
                  await supabase.functions.invoke("send-email-change-notification", {
                    body: { 
                      oldEmail: currentEmail, 
                      newEmail: newEmail,
                      displayName: profile.display_name 
                    },
                  });

                  toast({ 
                    title: "Verification email sent", 
                    description: "Please check your new email to verify the change",
                    duration: 8000
                  });
                  
                  setNewEmail("");
                  setEmailPassword("");
                } catch (err: any) {
                  toast({ 
                    title: "Error updating email", 
                    description: getAuthErrorMessage(err), 
                    variant: "destructive" 
                  });
                } finally {
                  setEmailLoading(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="currentEmail">Current Email</Label>
                <Input
                  id="currentEmail"
                  type="email"
                  value={currentEmail}
                  disabled
                  className="mt-1 opacity-60"
                />
              </div>
              <div>
                <Label htmlFor="newEmail">New Email Address</Label>
                <Input
                  id="newEmail"
                  type="email"
                  placeholder="newemail@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="emailPassword">Current Password (for verification)</Label>
                <Input
                  id="emailPassword"
                  type="password"
                  placeholder="Enter your current password"
                  value={emailPassword}
                  onChange={(e) => setEmailPassword(e.target.value)}
                  required
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  We need your password to confirm this change
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={emailLoading}>
                {emailLoading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Updating Email...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Update Email Address
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Social Links Section */}
          <div className="glass-card rounded-2xl p-8 mt-8">
            <h2 className="text-2xl font-semibold mb-4">Social Links</h2>
            <SocialLinksManager userId={userId!} profile={profile} onUpdate={() => fetchProfile(userId!)} />
          </div>

          {/* Custom Links Section */}
          <div className="glass-card rounded-2xl p-8 mt-8">
            <h2 className="text-2xl font-semibold mb-4">Custom Links</h2>
            <CustomLinksManager userId={userId!} profile={profile} onUpdate={() => fetchProfile(userId!)} />
          </div>

          {/* Language & Preferences Section */}
          <div className="glass-card rounded-2xl p-8 mt-8">
            <h2 className="text-2xl font-semibold mb-4">Preferences</h2>
            <LanguageSelector />
          </div>

          {/* Privacy Settings Section */}
          <div className="glass-card rounded-2xl p-8 mt-8">
            <PrivacySettings />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
