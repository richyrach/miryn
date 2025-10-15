import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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

const NewProject = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        navigate("/login");
      } else {
        const { data } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", session.user.id)
          .single();
        
        if (data) {
          setProfileId(data.id);
        }
      }
    });
  }, [navigate]);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .substring(0, 50);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profileId) return;
    
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    const title = formData.get("title") as string;
    const slugInput = formData.get("slug") as string;
    const slug = slugInput || generateSlug(title);
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
      setLoading(false);
      return;
    }

    const ctas = ctaLabel && ctaUrl ? [{ label: ctaLabel, url: ctaUrl }] : [];

    const { error } = await supabase
      .from("projects")
      .insert({
        owner_id: profileId,
        title: validationResult.data.title,
        slug: validationResult.data.slug,
        summary: validationResult.data.summary || null,
        stack: validationResult.data.stack,
        ctas,
        published: true,
      });

    if (error) {
      toast({ 
        title: "Error creating project", 
        description: getDatabaseErrorMessage(error), 
        variant: "destructive" 
      });
    } else {
      toast({ title: "Project created successfully!" });
      navigate("/explore");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="pt-32 pb-20 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Create New Project</h1>
            <p className="text-muted-foreground">Showcase your work to the world</p>
          </div>

          <div className="glass-card rounded-2xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="title">Project Title *</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="My Awesome Project"
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="slug">URL Slug (optional)</Label>
                <Input
                  id="slug"
                  name="slug"
                  placeholder="my-awesome-project"
                  pattern="[a-z0-9-]{1,50}"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leave blank to auto-generate from title
                </p>
              </div>

              <div>
                <Label htmlFor="summary">Summary</Label>
                <Textarea
                  id="summary"
                  name="summary"
                  placeholder="Brief description of your project..."
                  className="mt-1 min-h-24"
                />
              </div>

              <div>
                <Label htmlFor="stack">Tech Stack (comma-separated)</Label>
                <Input
                  id="stack"
                  name="stack"
                  placeholder="React, Node.js, PostgreSQL..."
                  className="mt-1"
                />
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Call to Action</h3>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="ctaLabel">CTA Label</Label>
                    <Input
                      id="ctaLabel"
                      name="ctaLabel"
                      placeholder="e.g., View Live Demo"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="ctaUrl">CTA URL</Label>
                    <Input
                      id="ctaUrl"
                      name="ctaUrl"
                      type="url"
                      placeholder="https://..."
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full btn-hero" disabled={loading}>
                {loading ? "Creating project..." : "Create Project"}
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NewProject;
