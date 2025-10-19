import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { ProjectCard } from "@/components/ProjectCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Project {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  cover_url: string | null;
  stack: string[];
  public_profiles: {
    handle: string;
  };
}

const Explore = () => {
  const { t } = useTranslation();
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [hireableOnly, setHireableOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    let query = supabase
      .from("projects")
      .select(`
        id,
        title,
        slug,
        summary,
        cover_url,
        stack,
        public_profiles!inner(handle, hireable)
      `)
      .eq("published", true)
      .order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching projects:", error);
    } else {
      setProjects(data as any);
    }
    setLoading(false);
  };

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = !searchQuery || 
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.summary?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSkill = !skillFilter ||
      project.stack.some(tech => tech.toLowerCase().includes(skillFilter.toLowerCase()));
    
    const matchesHireable = !hireableOnly || (project.public_profiles as any).hireable;

    return matchesSearch && matchesSkill && matchesHireable;
  });

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('explore.title')}</h1>
            <p className="text-muted-foreground text-lg">
              {t('explore.description')}
            </p>
          </div>

          {/* Filters */}
          <div className="glass-card rounded-2xl p-6 mb-8">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="search">{t('explore.search')}</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder={t('explore.searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="skill">{t('explore.techStack')}</Label>
                <Input
                  id="skill"
                  placeholder={t('explore.techStackPlaceholder')}
                  value={skillFilter}
                  onChange={(e) => setSkillFilter(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="flex items-end">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hireable"
                    checked={hireableOnly}
                    onCheckedChange={(checked) => setHireableOnly(checked as boolean)}
                  />
                  <Label htmlFor="hireable" className="cursor-pointer">
                    {t('explore.hireableCreators')}
                  </Label>
                </div>
              </div>
            </div>
          </div>

          {/* Projects Grid */}
          {loading ? (
            <div className="text-center py-20 text-muted-foreground">
              {t('explore.loading')}
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              {t('explore.noProjects')}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  id={project.id}
                  title={project.title}
                  slug={project.slug}
                  summary={project.summary}
                  coverUrl={project.cover_url}
                  stack={project.stack}
                  ownerHandle={(project.public_profiles as any).handle}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Explore;
