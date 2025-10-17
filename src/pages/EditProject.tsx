import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { z } from "zod";
import { getDatabaseErrorMessage } from "@/lib/errorMessages";

const projectSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  slug: z.string().trim().min(1, "Slug is required").max(50, "Slug must be less than 50 characters").regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  summary: z.string().trim().max(500, "Summary must be less than 500 characters").optional(),
  stack: z.array(z.string().trim().max(30, "Each technology must be less than 30 characters")).max(20, "Maximum 20 technologies allowed"),
  ctaLabel: z.string().trim().max(50, "CTA label must be less than 50 characters").optional(),
  ctaUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

const EditProject = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [coverUrl, setCoverUrl] = useState('');
  const [project, setProject] = useState<any>(null);
  const [profileId, setProfileId] = useState<string | null>(null);

  useEffect(() => {
    const loadProject = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      // Get profile ID
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", session.user.id)
        .single();
      
      if (!profile) {
        toast({ title: "Error", description: "Profile not found", variant: "destructive" });
        navigate("/explore");
        return;
      }

      setProfileId(profile.id);

      // Get project
      const { data: projectData, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (error || !projectData) {
        toast({ title: "Error", description: "Project not found", variant: "destructive" });
        navigate("/explore");
        return;
      }

      // Check ownership
      if (projectData.owner_id !== profile.id) {
        toast({ title: "Error", description: "You don't have permission to edit this project", variant: "destructive" });
        navigate("/explore");
        return;
      }

      setProject(projectData);
      setCoverUrl(projectData.cover_url || '');
      setLoading(false);
    };

    loadProject();
  }, [projectId, navigate, toast]);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Error", description: "Image must be less than 5MB", variant: "destructive" });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({ title: "Error", description: "File must be an image", variant: "destructive" });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('banners')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('banners')
        .getPublicUrl(filePath);

      setCoverUrl(publicUrl);
      toast({ title: "Success", description: "Cover image uploaded" });
    } catch (error: any) {
      console.error('Error uploading cover:', error);
      toast({ title: "Error", description: "Failed to upload cover image", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profileId || !project) return;
    
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    
    const title = formData.get("title") as string;
    const slug = formData.get("slug") as string;
    const summary = formData.get("summary") as string;
    const stackInput = formData.get("stack") as string;
    const stack = stackInput ? stackInput.split(",").map((s) => s.trim()).filter(Boolean) : [];
    const ctaLabel = formData.get("ctaLabel") as string;
    const ctaUrl = formData.get("ctaUrl") as string;

    // Validate input
    const validationResult = projectSchema.safeParse({
      title,
      slug,
      summary: summary || undefined,
      stack,
      ctaLabel: ctaLabel || undefined,
      ctaUrl: ctaUrl || undefined,
    });

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(", ");
      toast({
        title: "Validation Error",
        description: errors,
        variant: "destructive",
      });
      setSaving(false);
      return;
    }

    const ctas = ctaLabel && ctaUrl ? [{ label: ctaLabel, url: ctaUrl }] : [];

    const { error } = await supabase
      .from("projects")
      .update({
        title: validationResult.data.title,
        slug: validationResult.data.slug,
        summary: validationResult.data.summary || null,
        stack: validationResult.data.stack,
        ctas,
        cover_url: coverUrl || null,
      })
      .eq("id", projectId);

    if (error) {
      toast({ 
        title: "Error updating project", 
        description: getDatabaseErrorMessage(error), 
        variant: "destructive" 
      });
    } else {
      toast({ title: "Project updated successfully!" });
      navigate(`/projects/${project.slug}`);
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="pt-32 pb-20 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-muted-foreground">Loading project...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!project) return null;

  const firstCta = project.ctas?.[0];

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="pt-32 pb-20 px-4 animate-fade-in">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Edit Project</h1>
            <p className="text-muted-foreground">Update your project details</p>
          </div>

          <div className="glass-card rounded-2xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="title">Project Name *</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="My Awesome App"
                  defaultValue={project.title}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="cover">Cover Image</Label>
                <Input 
                  id="cover" 
                  type="file" 
                  accept="image/*"
                  onChange={handleCoverUpload}
                  disabled={uploading}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {uploading ? "Uploading..." : coverUrl ? "✓ Image set" : "Max 5MB, JPG/PNG/WEBP"}
                </p>
              </div>

              <div>
                <Label htmlFor="slug">Project URL *</Label>
                <Input
                  id="slug"
                  name="slug"
                  placeholder="my-awesome-app"
                  defaultValue={project.slug}
                  pattern="[a-z0-9-]{1,50}"
                  required
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  URL-friendly version. Will appear as: /@you/{project.slug}
                </p>
              </div>

              <div>
                <Label htmlFor="summary">Description</Label>
                <Textarea
                  id="summary"
                  name="summary"
                  placeholder="Tell people what makes your project special..."
                  defaultValue={project.summary || ''}
                  className="mt-1 min-h-24"
                />
              </div>

              <div>
                <Label htmlFor="stack">Technologies Used</Label>
                <Input
                  id="stack"
                  name="stack"
                  placeholder="React, TypeScript, Tailwind CSS"
                  defaultValue={project.stack?.join(", ") || ''}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  List the tech stack, separated by commas
                </p>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Action Button</h3>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="ctaLabel">Button Text</Label>
                    <Input
                      id="ctaLabel"
                      name="ctaLabel"
                      placeholder="Try Live Demo"
                      defaultValue={firstCta?.label || ''}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="ctaUrl">Button Link</Label>
                    <Input
                      id="ctaUrl"
                      name="ctaUrl"
                      type="url"
                      placeholder="https://myproject.com"
                      defaultValue={firstCta?.url || ''}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full btn-hero" disabled={saving}>
                {saving ? "Saving changes..." : "Save Changes"}
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EditProject;
