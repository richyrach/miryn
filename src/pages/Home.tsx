import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Sparkles, Users, Rocket } from "lucide-react";
import { Navbar } from "@/components/Navbar";

const Home = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6 animate-fade-in">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Showcase your work, connect with talent</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent animate-fade-in">
              Build your portfolio,
              <br />
              Find your next opportunity
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in">
              Miryn is where creators showcase projects and hire amazing talent. 
              Simple profiles, powerful CTAs, instant connections.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
              <Button size="lg" className="btn-hero text-lg h-14 px-8" asChild>
                <Link to="/login">
                  <Rocket className="w-5 h-5 mr-2" />
                  Create your profile
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg h-14 px-8" asChild>
                <Link to="/explore">
                  Explore projects
                </Link>
              </Button>
            </div>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="glass-card rounded-2xl p-8 text-center animate-fade-in">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Users className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Simple Profiles</h3>
              <p className="text-muted-foreground">
                Create your profile in minutes. Share your intro, skills, and what you're looking for.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-8 text-center animate-fade-in">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Rocket className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Showcase Projects</h3>
              <p className="text-muted-foreground">
                Add your best work with outcomes, tech stack, and direct links to live demos.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-8 text-center animate-fade-in">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Clear CTAs</h3>
              <p className="text-muted-foreground">
                Hire talent, invite collaborators, or just say hi. One click, straight to action.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
