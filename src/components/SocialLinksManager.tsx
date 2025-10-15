import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { socialPlatforms, validateSocialUrl, type SocialPlatformId } from "@/lib/socialValidation";
import { Plus, Trash2 } from "lucide-react";

interface SocialLinksManagerProps {
  userId: string;
  profile: any;
  onUpdate: () => void;
}

export const SocialLinksManager = ({ userId, profile, onUpdate }: SocialLinksManagerProps) => {
  const { toast } = useToast();
  const [socialLinks, setSocialLinks] = useState<Array<{ platform: string; url: string }>>(
    profile?.social_links || []
  );
  const [newPlatform, setNewPlatform] = useState<SocialPlatformId>("instagram");
  const [newUrl, setNewUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const handleAddSocialLink = () => {
    if (!newUrl.trim()) {
      toast({
        title: "URL required",
        description: "Please enter a valid URL",
        variant: "destructive",
      });
      return;
    }

    if (!validateSocialUrl(newPlatform, newUrl)) {
      toast({
        title: "Invalid URL",
        description: `Please enter a valid ${newPlatform} URL`,
        variant: "destructive",
      });
      return;
    }

    // Check if platform already exists
    if (socialLinks.some(link => link.platform === newPlatform)) {
      toast({
        title: "Platform exists",
        description: "You already have a link for this platform",
        variant: "destructive",
      });
      return;
    }

    const updated = [...socialLinks, { platform: newPlatform, url: newUrl }];
    setSocialLinks(updated);
    setNewUrl("");
    saveSocialLinks(updated);
  };

  const handleRemoveSocialLink = (index: number) => {
    const updated = socialLinks.filter((_, i) => i !== index);
    setSocialLinks(updated);
    saveSocialLinks(updated);
  };

  const saveSocialLinks = async (links: Array<{ platform: string; url: string }>) => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ social_links: links })
      .eq("user_id", userId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update social links",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Social links updated",
      });
      onUpdate();
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Add your social media profiles. URLs will be validated to ensure they match the platform.
      </p>

      {/* Existing Links */}
      {socialLinks.length > 0 && (
        <div className="space-y-2">
          {socialLinks.map((link, index) => (
            <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
              <div className="flex-1">
                <p className="font-medium capitalize">{link.platform}</p>
                <p className="text-sm text-muted-foreground truncate">{link.url}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveSocialLink(index)}
                disabled={saving}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add New Link */}
      <div className="space-y-3 p-4 border-2 border-dashed rounded-lg">
        <Label>Add Social Link</Label>
        <div className="grid grid-cols-2 gap-3">
          <Select value={newPlatform} onValueChange={(value) => setNewPlatform(value as SocialPlatformId)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {socialPlatforms.map((platform) => (
                <SelectItem key={platform.id} value={platform.id}>
                  {platform.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder={`Enter ${newPlatform} URL`}
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddSocialLink()}
          />
        </div>
        <Button onClick={handleAddSocialLink} disabled={saving} className="w-full" variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Add Link
        </Button>
      </div>
    </div>
  );
};

