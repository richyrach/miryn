import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Switch } from "./ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";

export const PrivacySettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    who_can_message: "everyone",
    show_online_status: true,
    read_receipts: true,
    typing_indicators: true,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("privacy_settings")
        .eq("user_id", user.id)
        .single();

      if (data?.privacy_settings) {
        setSettings(data.privacy_settings as any);
      }
    } catch (error) {
      console.error("Error fetching privacy settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({ privacy_settings: settings })
        .eq("user_id", user.id);

      if (error) throw error;

      toast({ title: "Privacy settings updated" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loader2 className="w-6 h-6 animate-spin" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Privacy Settings</CardTitle>
        <CardDescription>
          Control who can contact you and what information is visible
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="who-can-message">Who can message me</Label>
          <Select
            value={settings.who_can_message}
            onValueChange={(value) =>
              setSettings({ ...settings, who_can_message: value })
            }
          >
            <SelectTrigger id="who-can-message">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="everyone">Everyone</SelectItem>
              <SelectItem value="followers">People I follow</SelectItem>
              <SelectItem value="none">No one</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="online-status">Show online status</Label>
            <p className="text-sm text-muted-foreground">
              Let others see when you're active
            </p>
          </div>
          <Switch
            id="online-status"
            checked={settings.show_online_status}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, show_online_status: checked })
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="read-receipts">Read receipts</Label>
            <p className="text-sm text-muted-foreground">
              Show when you've read messages
            </p>
          </div>
          <Switch
            id="read-receipts"
            checked={settings.read_receipts}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, read_receipts: checked })
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="typing-indicators">Typing indicators</Label>
            <p className="text-sm text-muted-foreground">
              Show when you're typing
            </p>
          </div>
          <Switch
            id="typing-indicators"
            checked={settings.typing_indicators}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, typing_indicators: checked })
            }
          />
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? "Saving..." : "Save Privacy Settings"}
        </Button>
      </CardContent>
    </Card>
  );
};
