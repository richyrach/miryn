import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectCard } from "@/components/ProjectCard";
import { ServiceCard } from "@/components/ServiceCard";
import { ProfileCard } from "@/components/ProfileCard";
import { supabase } from "@/integrations/supabase/client";
import { Bookmark, Loader2 } from "lucide-react";

const Bookmarks = () => {
  const [projects, setProjects] = useState([]);
  const [services, setServices] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Bookmarks | Miryn";
    fetchBookmarks();
  }, []);

  const fetchBookmarks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: bookmarksData } = await supabase
        .from("bookmarks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (bookmarksData) {
        // Fetch projects
        const projectIds = bookmarksData
          .filter(b => b.target_type === "project")
          .map(b => b.target_id);
        
        if (projectIds.length > 0) {
          const { data: projectsData } = await supabase
            .from("projects")
            .select(`
              *,
              profiles:owner_id (
                display_name,
                handle,
                avatar_url
              )
            `)
            .in("id", projectIds);
          setProjects(projectsData || []);
        }

        // Fetch services
        const serviceIds = bookmarksData
          .filter(b => b.target_type === "service")
          .map(b => b.target_id);
        
        if (serviceIds.length > 0) {
          const { data: servicesData } = await supabase
            .from("services")
            .select(`
              *,
              profiles:profile_id (
                display_name,
                handle,
                avatar_url
              )
            `)
            .in("id", serviceIds);
          setServices(servicesData || []);
        }

        // Fetch profiles
        const profileIds = bookmarksData
          .filter(b => b.target_type === "profile")
          .map(b => b.target_id);
        
        if (profileIds.length > 0) {
          const { data: profilesData } = await supabase
            .from("profiles")
            .select("*")
            .in("id", profileIds);
          setProfiles(profilesData || []);
        }
      }
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <Bookmark className="w-10 h-10" />
              Bookmarks
            </h1>
            <p className="text-muted-foreground">
              Your saved projects, services, and people
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <Tabs defaultValue="projects" className="w-full">
              <TabsList>
                <TabsTrigger value="projects">
                  Projects ({projects.length})
                </TabsTrigger>
                <TabsTrigger value="services">
                  Services ({services.length})
                </TabsTrigger>
                <TabsTrigger value="people">
                  People ({profiles.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="projects" className="mt-6">
                {projects.length === 0 ? (
                  <p className="text-center text-muted-foreground py-12">
                    No bookmarked projects yet
                  </p>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project: any) => (
                      <ProjectCard key={project.id} project={project} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="services" className="mt-6">
                {services.length === 0 ? (
                  <p className="text-center text-muted-foreground py-12">
                    No bookmarked services yet
                  </p>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {services.map((service: any) => (
                      <ServiceCard key={service.id} service={service} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="people" className="mt-6">
                {profiles.length === 0 ? (
                  <p className="text-center text-muted-foreground py-12">
                    No bookmarked people yet
                  </p>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {profiles.map((profile: any) => (
                      <ProfileCard key={profile.id} profile={profile} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>
    </div>
  );
};

export default Bookmarks;
