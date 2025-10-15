import { useState, useRef } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Upload } from "lucide-react";

interface CustomLinksManagerProps {
  userId: string;
  profile: any;
  onUpdate: () => void;
}

export const CustomLinksManager = ({ userId, profile, onUpdate }: CustomLinksManagerProps) => {
  const { toast } = useToast();
  const [customLinks, setCustomLinks] = useState<Array<{ name: string; url: string; logo_url?: string }>>(
    profile?.custom_links || []
  );
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newLogoFile, setNewLogoFile] = useState<File | null>(null);
  const [newLogoPreview, setNewLogoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddCustomLink = async () => {
    if (!newName.trim() || !newUrl.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter both name and URL",
        variant: "destructive",
      });
      return;
    }

    // Validate URL
    try {
      new URL(newUrl);
    } catch {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    let logoUrl = undefined;
    
    // Upload logo if provided
    if (newLogoFile) {
      try {
        const logoPath = `${userId}/custom-link-${Date.now()}.${newLogoFile.name.split('.').pop()}`;
        const { data, error } = await supabase.storage
          .from('avatars')
          .upload(logoPath, newLogoFile, { upsert: true });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(logoPath);

        logoUrl = publicUrl;
      } catch (error) {
        toast({
          title: "Error uploading logo",
          description: "Failed to upload logo image",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }
    }

    const newLink = { 
      name: newName.trim(), 
      url: newUrl.trim(),
      ...(logoUrl && { logo_url: logoUrl })
    };
    const updated = [...customLinks, newLink];
    setCustomLinks(updated);
    setNewName("");
    setNewUrl("");
    setNewLogoFile(null);
    setNewLogoPreview(null);
    
    await saveCustomLinks(updated);
    setSaving(false);
  };

  const handleRemoveCustomLink = (index: number) => {
    const updated = customLinks.filter((_, i) => i !== index);
    setCustomLinks(updated);
    saveCustomLinks(updated);
  };

  const saveCustomLinks = async (links: Array<{ name: string; url: string; logo_url?: string }>) => {
    const { error } = await supabase
      .from("profiles")
      .update({ custom_links: links })
      .eq("user_id", userId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update custom links",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Custom links updated",
      });
      onUpdate();
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Add custom links with optional logos. Perfect for portfolios, websites, or other resources.
      </p>

      {/* Existing Links */}
      {customLinks.length > 0 && (
        <div className="space-y-2">
          {customLinks.map((link, index) => (
            <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
              {link.logo_url && (
                <img src={link.logo_url} alt={link.name} className="w-8 h-8 rounded object-cover" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{link.name}</p>
                <p className="text-sm text-muted-foreground truncate">{link.url}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveCustomLink(index)}
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
        <Label>Add Custom Link</Label>
        
        <div className="flex items-center gap-3">
          <div 
            className="w-16 h-16 rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer hover:border-primary transition-colors overflow-hidden"
            onClick={() => logoInputRef.current?.click()}
          >
            {newLogoPreview ? (
              <img src={newLogoPreview} alt="Logo preview" className="w-full h-full object-cover" />
            ) : (
              <Upload className="w-6 h-6 text-muted-foreground" />
            )}
          </div>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            onChange={handleLogoChange}
            className="hidden"
          />
          <div className="flex-1 space-y-2">
            <Input
              placeholder="Link name (e.g., My Portfolio)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <Input
              placeholder="https://example.com"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddCustomLink()}
            />
          </div>
        </div>
        
        <Button onClick={handleAddCustomLink} disabled={saving} className="w-full" variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Add Link
        </Button>
      </div>
    </div>
  );
};
