import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Bug, Lightbulb, Upload, X } from "lucide-react";
import { z } from "zod";

const feedbackSchema = z.object({
  type: z.enum(["bug", "suggestion"]),
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title must be less than 100 characters"),
  description: z.string().min(10, "Description must be at least 10 characters").max(1000, "Description must be less than 1000 characters"),
  url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

const Feedback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [type, setType] = useState<"bug" | "suggestion">("bug");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Screenshot must be less than 5MB",
          variant: "destructive",
        });
        return;
      }
      setScreenshot(file);
      const reader = new FileReader();
      reader.onloadend = () => setScreenshotPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeScreenshot = () => {
    setScreenshot(null);
    setScreenshotPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validated = feedbackSchema.parse({ type, title, description, url: url || undefined });
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please sign in to submit feedback",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      setSubmitting(true);

      let screenshotUrl = null;
      if (screenshot) {
        const fileExt = screenshot.name.split(".").pop();
        const fileName = `${session.user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("banners")
          .upload(fileName, screenshot);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("banners")
          .getPublicUrl(fileName);

        screenshotUrl = publicUrl;
      }

      const { error } = await supabase
        .from("feedback")
        .insert({
          user_id: session.user.id,
          type: validated.type,
          title: validated.title,
          description: validated.description,
          url: validated.url || null,
          screenshot_url: screenshotUrl,
        });

      if (error) throw error;

      toast({
        title: "Feedback submitted!",
        description: "Thank you for helping us improve the platform.",
      });

      setType("bug");
      setTitle("");
      setDescription("");
      setUrl("");
      setScreenshot(null);
      setScreenshotPreview(null);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error submitting feedback",
          description: "Please try again later",
          variant: "destructive",
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 pt-32 pb-16">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">Submit Feedback</CardTitle>
            <CardDescription>
              Help us improve by reporting bugs or suggesting new features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <Label>Type</Label>
                <RadioGroup value={type} onValueChange={(v) => setType(v as "bug" | "suggestion")}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="bug" id="bug" />
                    <Label htmlFor="bug" className="flex items-center gap-2 cursor-pointer">
                      <Bug className="w-4 h-4 text-red-500" />
                      Bug Report
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="suggestion" id="suggestion" />
                    <Label htmlFor="suggestion" className="flex items-center gap-2 cursor-pointer">
                      <Lightbulb className="w-4 h-4 text-yellow-500" />
                      Feature Suggestion
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={type === "bug" ? "Brief description of the bug" : "Brief description of your idea"}
                  maxLength={100}
                  required
                />
                <p className="text-xs text-muted-foreground">{title.length}/100 characters</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={type === "bug" ? "What happened? What did you expect to happen?" : "Describe your feature idea and how it would help"}
                  rows={6}
                  maxLength={1000}
                  required
                />
                <p className="text-xs text-muted-foreground">{description.length}/1000 characters</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="url">Related URL (optional)</Label>
                <Input
                  id="url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/page-with-issue"
                />
              </div>

              <div className="space-y-2">
                <Label>Screenshot (optional)</Label>
                {screenshotPreview ? (
                  <div className="relative">
                    <img src={screenshotPreview} alt="Screenshot preview" className="rounded-lg border w-full max-h-64 object-contain" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={removeScreenshot}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <Label htmlFor="screenshot-upload" className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                      Click to upload screenshot (max 5MB)
                    </Label>
                    <Input
                      id="screenshot-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleScreenshotChange}
                      className="hidden"
                    />
                  </div>
                )}
              </div>

              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? "Submitting..." : "Submit Feedback"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Feedback;
