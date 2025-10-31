import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { ReportButton } from "@/components/ReportButton";
import { ProjectCommentSection } from "@/components/ProjectCommentSection";
import { ProjectGallery } from "@/components/ProjectGallery";
import { ProjectOutcomes } from "@/components/ProjectOutcomes";
import { ProjectLinks } from "@/components/ProjectLinks";
import { useToast } from "@/hooks/use-toast";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Project = () => {
  const { handle, projectSlug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [project, setProject] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { isAdmin: isAdminUser } = useAdminCheck();

  useEffect(() => {
    if (handle && projectSlug) {
      fetchProject();
    }
  }, [handle, projectSlug]);

  const fetchProject = async () => {
    setLoading(true);
    
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("handle", handle)
      .single();

    if (profileData) {
      setProfile(profileData);
      
      const { data: projectData } = await supabase
        .from("projects")
        .select("*")
        .eq("owner_id", profileData.id)
        .eq("slug", projectSlug)
        .single();

      setProject(projectData);

      // Check if current user is the owner
      const { data: { session } } = await supabase.auth.getSession();
      if (session && profileData.user_id === session.user.id) {
        setIsOwner(true);
      }
    }
    
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!project) return;
    
    setDeleting(true);
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", project.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Project deleted successfully",
      });
      navigate(`/${handle}`);
    }
    setDeleting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-32 text-center">Loading project...</div>
      </div>
    );
  }

  if (!project || !profile) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-32 text-center">
          <h1 className="text-4xl font-bold mb-4">Project not found</h1>
          <Button asChild>
            <Link to="/explore">Browse Projects</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="pt-32 pb-20 px-4">
        <div className="max-w-5xl mx-auto">
          <Button variant="ghost" asChild className="mb-6">
            <Link to={`/${handle}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to @{handle}
            </Link>
          </Button>

          {/* Project Gallery */}
          <ProjectGallery 
            coverUrl={project.cover_url} 
            galleryImages={project.gallery_images || []} 
          />

          <div className="glass-card rounded-2xl p-8 mb-8">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl md:text-5xl font-bold">{project.title}</h1>
                  {project.category && (
                    <Badge variant="secondary" className="text-sm">
                      {project.category}
                    </Badge>
                  )}
                </div>
                {project.tags && project.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {project.tags.map((tag: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              
              {isOwner && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/projects/${project.id}/edit`)}
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" disabled={deleting}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Project?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete your project
                          and all associated data.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                          Delete Project
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
            
            <p className="text-muted-foreground text-lg mb-6">
              by <Link to={`/${handle}`} className="text-primary hover:underline">
                @{handle}
              </Link>
            </p>

            {project.summary && (
              <p className="text-lg text-foreground mb-6">{project.summary}</p>
            )}

            {project.detailed_description && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">About This Project</h3>
                <div className="prose prose-invert max-w-none">
                  <p className="whitespace-pre-wrap text-muted-foreground">{project.detailed_description}</p>
                </div>
              </div>
            )}

            {/* Tech Stack */}
            {project.stack && project.stack.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Tech Stack</h3>
                <div className="flex flex-wrap gap-2">
                  {project.stack.map((tech: string, i: number) => (
                    <Badge key={i} variant="secondary">{tech}</Badge>
                  ))}
                </div>
              </div>
            )}


             {/* Project Links */}
             <ProjectLinks links={project.ctas || []} />

             {/* Report */}
             <div className="pt-6">
               <ReportButton targetType="project" targetId={project.id} />
             </div>
           </div>

           {/* Project Outcomes */}
           <ProjectOutcomes outcomes={project.outcomes || []} />

           {/* Comments Section */}
           <div className="glass-card rounded-2xl p-8">
             <ProjectCommentSection projectId={project.id} isAdmin={isAdminUser} />
           </div>
        </div>
      </main>
    </div>
  );
};

export default Project;
