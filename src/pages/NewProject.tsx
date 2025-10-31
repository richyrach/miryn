import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { ImageGalleryUploader } from "@/components/ImageGalleryUploader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";
import { z } from "zod";
import { getDatabaseErrorMessage } from "@/lib/errorMessages";

const CATEGORIES = ["Web", "Mobile", "Design", "AI/ML", "DevOps", "Gaming", "Other"];

const projectSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  slug: z.string().trim().min(1, "Slug is required").max(50, "Slug must be less than 50 characters").regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  summary: z.string().trim().max(500, "Summary must be less than 500 characters").optional(),
  detailedDescription: z.string().trim().max(5000, "Detailed description must be less than 5000 characters").optional(),
  category: z.string().optional(),
  tags: z.array(z.string().trim().max(20, "Each tag must be less than 20 characters")).max(10, "Maximum 10 tags allowed"),
  stack: z.array(z.string().trim().max(30, "Each technology must be less than 30 characters")).max(20, "Maximum 20 technologies allowed"),
  ctaLabel: z.string().trim().max(50, "CTA label must be less than 50 characters").optional(),
  ctaUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

const NewProject = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [coverUrl, setCoverUrl] = useState('');
  const [profileId, setProfileId] = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<Array<{url: string; caption: string; order: number}>>([]);
  const [category, setCategory] = useState<string>("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [outcomes, setOutcomes] = useState<Array<{label: string; value: string; icon: string}>>([]);
  const [links, setLinks] = useState<Array<{label: string; url: string; type: string}>>([]);

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

  const addTag = () => {
    if (tagInput.trim() && tags.length < 10 && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
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
    const detailedDescription = formData.get("detailedDescription") as string;
    const stackInput = formData.get("stack") as string;
    const stack = stackInput ? stackInput.split(",").map((s) => s.trim()).filter(Boolean) : [];
    const ctaLabel = formData.get("ctaLabel") as string;
    const ctaUrl = formData.get("ctaUrl") as string;

    // Validate input
    const validationResult = projectSchema.safeParse({
      title,
      slug,
      summary: summary || undefined,
      detailedDescription: detailedDescription || undefined,
      category: category || undefined,
      tags,
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
        detailed_description: validationResult.data.detailedDescription || null,
        category: validationResult.data.category || null,
        tags: validationResult.data.tags,
        stack: validationResult.data.stack,
        ctas: links.length > 0 ? links : (ctas.length > 0 ? ctas : []),
        outcomes: outcomes.length > 0 ? outcomes : [],
        gallery_images: galleryImages,
        cover_url: coverUrl || null,
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
      
      <main className="pt-32 pb-20 px-4 animate-fade-in">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Create New Project</h1>
            <p className="text-muted-foreground">Showcase your work to the world</p>
          </div>

          <div className="glass-card rounded-2xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="title">Project Name *</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="My Awesome App"
                  required
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Give your project a catchy name
                </p>
              </div>

              <div>
                <Label htmlFor="cover">Cover Image (optional)</Label>
                <Input 
                  id="cover" 
                  type="file" 
                  accept="image/*"
                  onChange={handleCoverUpload}
                  disabled={uploading}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {uploading ? "Uploading..." : coverUrl ? "✓ Image uploaded" : "Max 5MB, JPG/PNG/WEBP"}
                </p>
              </div>

              <div>
                <Label htmlFor="slug">Project URL (optional)</Label>
                <Input
                  id="slug"
                  name="slug"
                  placeholder="my-awesome-app"
                  pattern="[a-z0-9-]{1,50}"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Short URL-friendly version (leave blank to auto-generate). Will appear as: /@you/your-project-url
                </p>
              </div>

              <div>
                <Label htmlFor="summary">Short Description</Label>
                <Textarea
                  id="summary"
                  name="summary"
                  placeholder="A brief overview of your project..."
                  className="mt-1 min-h-20"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Short summary (shown on cards)
                </p>
              </div>

              <div>
                <Label htmlFor="detailedDescription">Detailed Description</Label>
                <Textarea
                  id="detailedDescription"
                  name="detailedDescription"
                  placeholder="Tell the full story of your project... What problem did it solve? How did you build it? What were the results?"
                  className="mt-1 min-h-32"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Full project description with all details (supports markdown)
                </p>
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Choose the main category for your project
                </p>
              </div>

              <div>
                <Label htmlFor="tags">Tags</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="tags"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    placeholder="Add a tag and press Enter"
                    disabled={tags.length >= 10}
                  />
                  <Button type="button" onClick={addTag} disabled={tags.length >= 10 || !tagInput.trim()}>
                    Add
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <X className="w-3 h-3 cursor-pointer" onClick={() => removeTag(tag)} />
                      </Badge>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Add up to 10 tags for discoverability
                </p>
              </div>

              <div>
                <Label htmlFor="stack">Technologies Used</Label>
                <Input
                  id="stack"
                  name="stack"
                  placeholder="React, TypeScript, Tailwind CSS"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  List the tech stack, separated by commas
                </p>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Project Gallery</h3>
                <ImageGalleryUploader
                  images={galleryImages}
                  onChange={setGalleryImages}
                  bucketName="banners"
                  maxImages={10}
                  uploading={uploading}
                  setUploading={setUploading}
                />
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Project Links (GitHub, Demo, etc.)</h3>
                <div className="space-y-4">
                  {links.map((link, index) => (
                    <div key={index} className="flex gap-2 items-end">
                      <div className="flex-1">
                        <Label>Label</Label>
                        <Input
                          value={link.label}
                          onChange={(e) => {
                            const newLinks = [...links];
                            newLinks[index].label = e.target.value;
                            setLinks(newLinks);
                          }}
                          placeholder="GitHub Repo"
                        />
                      </div>
                      <div className="flex-1">
                        <Label>URL</Label>
                        <Input
                          value={link.url}
                          onChange={(e) => {
                            const newLinks = [...links];
                            newLinks[index].url = e.target.value;
                            setLinks(newLinks);
                          }}
                          placeholder="https://github.com/..."
                        />
                      </div>
                      <div className="w-32">
                        <Label>Type</Label>
                        <Select
                          value={link.type}
                          onValueChange={(value) => {
                            const newLinks = [...links];
                            newLinks[index].type = value;
                            setLinks(newLinks);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="github">GitHub</SelectItem>
                            <SelectItem value="website">Website</SelectItem>
                            <SelectItem value="demo">Demo</SelectItem>
                            <SelectItem value="app">App</SelectItem>
                            <SelectItem value="case_study">Case Study</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => setLinks(links.filter((_, i) => i !== index))}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLinks([...links, { label: '', url: '', type: 'github' }])}
                  >
                    Add Link
                  </Button>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Outcomes & Impact</h3>
                <div className="space-y-4">
                  {outcomes.map((outcome, index) => (
                    <div key={index} className="flex gap-2 items-end">
                      <div className="flex-1">
                        <Label>Label</Label>
                        <Input
                          value={outcome.label}
                          onChange={(e) => {
                            const newOutcomes = [...outcomes];
                            newOutcomes[index].label = e.target.value;
                            setOutcomes(newOutcomes);
                          }}
                          placeholder="Users reached"
                        />
                      </div>
                      <div className="flex-1">
                        <Label>Value</Label>
                        <Input
                          value={outcome.value}
                          onChange={(e) => {
                            const newOutcomes = [...outcomes];
                            newOutcomes[index].value = e.target.value;
                            setOutcomes(newOutcomes);
                          }}
                          placeholder="10,000+"
                        />
                      </div>
                      <div className="w-32">
                        <Label>Icon</Label>
                        <Select
                          value={outcome.icon}
                          onValueChange={(value) => {
                            const newOutcomes = [...outcomes];
                            newOutcomes[index].icon = value;
                            setOutcomes(newOutcomes);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="users">Users</SelectItem>
                            <SelectItem value="growth">Growth</SelectItem>
                            <SelectItem value="revenue">Revenue</SelectItem>
                            <SelectItem value="metrics">Metrics</SelectItem>
                            <SelectItem value="target">Target</SelectItem>
                            <SelectItem value="award">Award</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => setOutcomes(outcomes.filter((_, i) => i !== index))}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOutcomes([...outcomes, { label: '', value: '', icon: 'target' }])}
                  >
                    Add Outcome
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full btn-hero" disabled={loading || uploading}>
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
