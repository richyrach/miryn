import { Link, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { User, LogOut, Settings, PlusCircle, Shield, MessageCircle, Briefcase, Menu, X, MessageSquareWarning } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { NotificationBell } from "./NotificationBell";

export const Navbar = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [handle, setHandle] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setHandle(null);
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    // Get profile handle
    const { data: profile } = await supabase
      .from("profiles")
      .select("handle, id")
      .eq("user_id", userId)
      .single();
    
    if (profile) {
      setHandle(profile.handle);
      
      // Fetch pending request count
      const { count } = await supabase
        .from("service_requests")
        .select("*", { count: "exact", head: true })
        .eq("seller_profile_id", profile.id)
        .eq("status", "pending");
      
      setPendingCount(count || 0);
    }

    // Check admin status
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    
    const hasAdminRole = roles?.some(r => ['owner', 'admin', 'moderator'].includes(r.role));
    setIsAdmin(hasAdminRole || false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <nav className="fixed top-0 w-full z-50 glass-card border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-xl sm:text-2xl font-bold text-primary">
            Miryn
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/explore" className="text-foreground hover:text-primary transition-colors">
              {t('nav.explore')}
            </Link>
            <Link to="/people" className="text-foreground hover:text-primary transition-colors">
              {t('nav.people')}
            </Link>
            <Link to="/services" className="text-foreground hover:text-primary transition-colors">
              {t('nav.services')}
            </Link>

            {user && (
              <>
                <Link to="/service-requests" className="text-foreground hover:text-primary transition-colors relative">
                  {t('nav.services')}
                  {pendingCount > 0 && (
                    <span className="absolute -top-1 -right-3 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {pendingCount}
                    </span>
                  )}
                </Link>
                <Link to="/messages" className="text-foreground hover:text-primary transition-colors">
                  <MessageCircle className="w-5 h-5" />
                </Link>
                <NotificationBell />
              </>
            )}

            {user ? (
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/new">
                    <PlusCircle className="w-4 h-4 mr-2" />
                    New
                  </Link>
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <User className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-background border z-50">
                    <DropdownMenuLabel>{t('settings.account')}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {handle && (
                      <DropdownMenuItem asChild>
                        <Link to={`/${handle}`} className="cursor-pointer">
                          <User className="w-4 h-4 mr-2" />
                          View Profile
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                        <Link to="/settings" className="cursor-pointer">
                          <Settings className="w-4 h-4 mr-2" />
                          {t('nav.settings')}
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link to="/feedback" className="cursor-pointer">
                          <MessageSquareWarning className="w-4 h-4 mr-2" />
                          {t('nav.feedback')}
                        </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link to="/admin" className="cursor-pointer text-primary">
                            <Shield className="w-4 h-4 mr-2" />
                            {t('nav.admin')}
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                      <LogOut className="w-4 h-4 mr-2" />
                      {t('nav.signOut')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Button asChild className="btn-hero">
                <Link to="/auth">
                  <User className="w-4 h-4 mr-2" />
                  {t('nav.signIn')}
                </Link>
              </Button>
            )}
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden flex items-center gap-2">
            {user && (
              <Button variant="ghost" size="sm" asChild>
                <Link to="/messages">
                  <MessageCircle className="w-5 h-5" />
                </Link>
              </Button>
            )}
            
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <div className="flex flex-col gap-4 mt-8">
                  <Link 
                    to="/explore" 
                    className="text-lg font-medium hover:text-primary transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Explore
                  </Link>
                  <Link 
                    to="/people" 
                    className="text-lg font-medium hover:text-primary transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    People
                  </Link>
                  <Link 
                    to="/services" 
                    className="text-lg font-medium hover:text-primary transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Services
                  </Link>

                  {user ? (
                    <>
                      <Link 
                        to="/service-requests" 
                        className="text-lg font-medium hover:text-primary transition-colors relative inline-block"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Requests
                        {pendingCount > 0 && (
                          <span className="absolute -top-1 -right-6 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {pendingCount}
                          </span>
                        )}
                      </Link>
                      
                      <div className="border-t pt-4 flex gap-2">
                        <Button variant="ghost" size="sm" asChild className="flex-1 justify-start">
                          <Link to="/messages" onClick={() => setMobileMenuOpen(false)}>
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Messages
                          </Link>
                        </Button>
                        <NotificationBell />
                      </div>
                      
                      <div className="border-t pt-4">
                        <Button variant="ghost" size="sm" asChild className="w-full justify-start">
                          <Link to="/new" onClick={() => setMobileMenuOpen(false)}>
                            <PlusCircle className="w-4 h-4 mr-2" />
                            New Project
                          </Link>
                        </Button>
                      </div>

                      <div className="border-t pt-4">
                        {handle && (
                          <Button variant="ghost" size="sm" asChild className="w-full justify-start mb-2">
                            <Link to={`/${handle}`} onClick={() => setMobileMenuOpen(false)}>
                              <User className="w-4 h-4 mr-2" />
                              View Profile
                            </Link>
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" asChild className="w-full justify-start mb-2">
                          <Link to="/settings" onClick={() => setMobileMenuOpen(false)}>
                            <Settings className="w-4 h-4 mr-2" />
                            Settings
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm" asChild className="w-full justify-start mb-2">
                          <Link to="/feedback" onClick={() => setMobileMenuOpen(false)}>
                            <MessageSquareWarning className="w-4 h-4 mr-2" />
                            Feedback
                          </Link>
                        </Button>
                        {isAdmin && (
                          <Button variant="ghost" size="sm" asChild className="w-full justify-start mb-2">
                            <Link to="/admin" onClick={() => setMobileMenuOpen(false)}>
                              <Shield className="w-4 h-4 mr-2" />
                              Admin Panel
                            </Link>
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            handleSignOut();
                            setMobileMenuOpen(false);
                          }}
                          className="w-full justify-start text-destructive"
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          Sign Out
                        </Button>
                      </div>
                    </>
                  ) : (
                    <Button asChild className="btn-hero w-full">
                      <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                        <User className="w-4 h-4 mr-2" />
                        Sign in
                      </Link>
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};
