import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Sparkles, Users, Rocket, TrendingUp, Briefcase } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { StatsCounter } from "@/components/StatsCounter";
import { ProjectCard } from "@/components/ProjectCard";
import { ServiceCard } from "@/components/ServiceCard";
import { supabase } from "@/integrations/supabase/client";

const Home = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    creators: 0,
    projects: 0,
    services: 0,
    connections: 0,
  });
  const [featuredProjects, setFeaturedProjects] = useState<any[]>([]);
  const [featuredServices, setFeaturedServices] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();
    fetchFeaturedProjects();
    fetchFeaturedServices();
  }, []);

  const fetchStats = async () => {
    const [
      { count: creators },
      { count: projects },
      { count: services },
      { count: connections },
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("projects").select("*", { count: "exact", head: true }).eq("published", true),
      supabase.from("services").select("*", { count: "exact", head: true }).eq("active", true),
      supabase.from("follows").select("*", { count: "exact", head: true }),
    ]);

    setStats({
      creators: creators || 0,
      projects: projects || 0,
      services: services || 0,
      connections: connections || 0,
    });
  };

  const fetchFeaturedProjects = async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data } = await supabase
      .from("projects")
      .select(
        `
        id,
        title,
        slug,
        summary,
        cover_url,
        stack,
        owner_id,
        profiles!projects_owner_id_fkey (handle)
      `
      )
      .eq("published", true)
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(6);

    setFeaturedProjects(data || []);
  };

  const fetchFeaturedServices = async () => {
    const { data } = await supabase
      .from("services")
      .select("id, title, category, pricing_type, price_amount, currency, delivery_time, description")
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(4);

    setFeaturedServices(data || []);
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-20 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                Showcase your work, connect with talent
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent px-4">
              Build your portfolio,
              <br />
              Find your next opportunity
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 px-4">
              Miryn is where creators showcase projects and hire amazing talent.
              Simple profiles, powerful CTAs, instant connections.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
              <Button
                size="lg"
                className="btn-hero text-base sm:text-lg h-12 sm:h-14 px-6 sm:px-8"
                asChild
              >
                <Link to="/login">
                  <Rocket className="w-5 h-5 mr-2" />
                  {t('auth.createAccount')}
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-base sm:text-lg h-12 sm:h-14 px-6 sm:px-8"
                asChild
              >
                <Link to="/explore">{t('nav.explore')}</Link>
              </Button>
            </div>
          </div>

          {/* Live Stats */}
          <div className="glass-card rounded-2xl p-8 mb-20 animate-fade-in">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <StatsCounter end={stats.creators} label={t('people.title')} />
              <StatsCounter end={stats.projects} label={t('profile.projects')} />
              <StatsCounter end={stats.services} label={t('profile.services')} />
              <StatsCounter end={stats.connections} label="Connections" />
            </div>
          </div>

          {/* Featured Projects */}
          {featuredProjects.length > 0 && (
            <div className="mb-20 animate-fade-in">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold">{t('explore.latestProjects')}</h2>
                <Button variant="outline" asChild>
                  <Link to="/explore">{t('common.viewAll')}</Link>
                </Button>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    id={project.id}
                    title={project.title}
                    slug={project.slug}
                    summary={project.summary}
                    coverUrl={project.cover_url}
                    stack={project.stack || []}
                    ownerHandle={project.profiles?.handle || ""}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Featured Services */}
          {featuredServices.length > 0 && (
            <div className="mb-20 animate-fade-in">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold">{t('service.browseServices')}</h2>
                <Button variant="outline" asChild>
                  <Link to="/services">{t('common.viewAll')}</Link>
                </Button>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredServices.map((service) => (
                  <ServiceCard key={service.id} {...service} />
                ))}
              </div>
            </div>
          )}

          {/* How It Works */}
          <div className="mb-20 animate-fade-in">
            <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">1. Create Your Profile</h3>
                <p className="text-muted-foreground">
                  Set up your profile in minutes with your skills, bio, and social links
                </p>
              </div>

              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Rocket className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">2. Showcase Your Work</h3>
                <p className="text-muted-foreground">
                  Add projects with outcomes, tech stack, and live demos to impress visitors
                </p>
              </div>

              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Briefcase className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">3. Get Hired</h3>
                <p className="text-muted-foreground">
                  Connect with clients through CTAs or offer your services directly
                </p>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 mb-20">
            <div className="glass-card rounded-2xl p-6 sm:p-8 text-center animate-fade-in">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-3">Simple Profiles</h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Create your profile in minutes. Share your intro, skills, and what
                you're looking for.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-6 sm:p-8 text-center animate-fade-in">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Rocket className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-3">
                Showcase Projects
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Add your best work with outcomes, tech stack, and direct links to
                live demos.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-6 sm:p-8 text-center animate-fade-in sm:col-span-2 md:col-span-1">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-3">Clear CTAs</h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Hire talent, invite collaborators, or just say hi. One click,
                straight to action.
              </p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="glass-card rounded-2xl p-12 text-center bg-gradient-to-r from-primary/10 to-accent/10 animate-fade-in">
            <TrendingUp className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">Ready to showcase your work?</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of creators who are already building their portfolios
              and connecting with opportunities on Miryn.
            </p>
            <Button size="lg" className="btn-hero" asChild>
              <Link to="/login">
                <Rocket className="w-5 h-5 mr-2" />
                Create your free profile
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
