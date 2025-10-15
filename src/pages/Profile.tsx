import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProjectCard } from "@/components/ProjectCard";
import { RoleBadge } from "@/components/RoleBadge";
import { FollowButton } from "@/components/FollowButton";
import { MessageButton } from "@/components/MessageButton";
import { User, MapPin, ExternalLink } from "lucide-react";
import { ReportButton } from "@/components/ReportButton";

const Profile = () => {
  const { handle } = useParams();
  const [profile, setProfile] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [targetUserId, setTargetUserId] = useState<string | null>(null);

  useEffect(() => {
    if (handle) {
      fetchProfile();
    }
  }, [handle]);

  const fetchProfile = async () => {
    setLoading(true);
    
    const { data: profileData } = await supabase
      .from("public_profiles")
      .select("*")
      .eq("handle", handle)
      .single();

    if (profileData) {
      setProfile(profileData);
      
      const { data: projectsData } = await supabase
        .from("projects")
        .select("*")
        .eq("owner_id", profileData.id)
        .eq("published", true)
        .order("created_at", { ascending: false });

      setProjects(projectsData || []);

      // Get user_id for follow counts
      const { data: profileWithUserId } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("id", profileData.id)
        .single();

      if (profileWithUserId) {
        setTargetUserId(profileWithUserId.user_id);
        // Get follower count
        const { data: followers } = await supabase
          .from("follows")
          .select("id")
          .eq("following_id", profileWithUserId.user_id);
        setFollowerCount(followers?.length || 0);

        // Get following count
        const { data: following } = await supabase
          .from("follows")
          .select("id")
          .eq("follower_id", profileWithUserId.user_id);
        setFollowingCount(following?.length || 0);
      }
    }
    
    setLoading(false);
  };

  const getCtaLabel = (cta: string | null) => {
    switch (cta) {
      case "hire": return "Hire me";
      case "invite_bot": return "Invite to collaborate";
      case "contact": return "Contact";
      case "custom": return "Get in touch";
      default: return "Contact";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-32 text-center">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-32 text-center">
          <h1 className="text-4xl font-bold mb-4">Profile not found</h1>
          <Button asChild>
            <Link to="/people">Browse People</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Profile Header */}
          <div className="glass-card rounded-2xl overflow-hidden mb-12">
            {/* Banner */}
            {profile.banner_url && (
              <div className="w-full h-48 md:h-64 overflow-hidden">
                <img src={profile.banner_url} alt="Profile banner" className="w-full h-full object-cover" />
              </div>
            )}
            
            <div className="p-8">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className={`w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden border-4 border-background flex-shrink-0 ${profile.banner_url ? '-mt-16' : ''}`}>
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.display_name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 text-muted-foreground" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <h1 className="text-3xl md:text-4xl font-bold">{profile.display_name}</h1>
                    <RoleBadge role={profile.role} />
                    {profile.hireable && (
                      <Badge className="badge-hireable">Available for hire</Badge>
                    )}
                  </div>
                
                <p className="text-lg text-muted-foreground mb-2">@{profile.handle}</p>
                
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-sm text-muted-foreground">
                    <strong className="text-foreground">{followerCount}</strong> Followers
                  </span>
                  <span className="text-sm text-muted-foreground">
                    <strong className="text-foreground">{followingCount}</strong> Following
                  </span>
                </div>

                 <div className="flex flex-wrap gap-2 mb-4">
                   {targetUserId && (
                     <>
                       <FollowButton targetUserId={targetUserId} targetHandle={profile.handle} />
                       <MessageButton targetUserId={targetUserId} targetHandle={profile.handle} />
                       <ReportButton targetType="user" targetId={targetUserId} />
                     </>
                   )}
                 </div>
                
                {profile.location && (
                  <p className="flex items-center gap-2 text-muted-foreground mb-4">
                    <MapPin className="w-4 h-4" />
                    {profile.location}
                  </p>
                )}

                {profile.bio && (
                  <p className="text-foreground mb-4 max-w-2xl">{profile.bio}</p>
                )}

                {profile.skills && profile.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {profile.skills.map((skill: string, i: number) => (
                      <Badge key={i} variant="secondary">{skill}</Badge>
                    ))}
                  </div>
                )}

                {profile.primary_cta_url && (
                  <Button className="btn-hero" asChild>
                    <a href={profile.primary_cta_url} target="_blank" rel="noopener noreferrer">
                      {getCtaLabel(profile.primary_cta)}
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </a>
                  </Button>
                )}
                </div>
              </div>

              {profile.intro_url && (
                <div className="mt-8 aspect-video bg-muted rounded-xl overflow-hidden">
                  <iframe
                    src={profile.intro_url.replace("watch?v=", "embed/")}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}
            </div>
          </div>

          {/* Projects */}
          <div>
            <h2 className="text-3xl font-bold mb-6">Projects</h2>
            
            {projects.length === 0 ? (
              <div className="glass-card rounded-2xl p-12 text-center text-muted-foreground">
                No projects yet.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    id={project.id}
                    title={project.title}
                    slug={project.slug}
                    summary={project.summary}
                    coverUrl={project.cover_url}
                    stack={project.stack}
                    ownerHandle={profile.handle}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
