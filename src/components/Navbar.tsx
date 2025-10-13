import { Link, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { User, LogOut, Settings, PlusCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export const Navbar = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <nav className="fixed top-0 w-full z-50 glass-card border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-2xl font-bold text-primary">
            Miryn
          </Link>

          <div className="flex items-center gap-6">
            <Link to="/explore" className="text-foreground hover:text-primary transition-colors">
              Explore
            </Link>
            <Link to="/people" className="text-foreground hover:text-primary transition-colors">
              People
            </Link>

            {user ? (
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/new">
                    <PlusCircle className="w-4 h-4 mr-2" />
                    New
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/settings">
                    <Settings className="w-4 h-4" />
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button asChild className="btn-hero">
                <Link to="/login">
                  <User className="w-4 h-4 mr-2" />
                  Sign in
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
