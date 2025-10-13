import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { ProfileCard } from "@/components/ProfileCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Search } from "lucide-react";

interface Profile {
  id: string;
  handle: string;
  display_name: string;
  skills: string[];
  hireable: boolean;
  avatar_url: string | null;
}

const People = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [hireableOnly, setHireableOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching profiles:", error);
    } else {
      setProfiles(data);
    }
    setLoading(false);
  };

  const filteredProfiles = profiles.filter((profile) => {
    const matchesSearch = !searchQuery || 
      profile.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesHireable = !hireableOnly || profile.hireable;

    return matchesSearch && matchesHireable;
  });

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Discover People</h1>
            <p className="text-muted-foreground text-lg">
              Connect with talented creators and collaborators
            </p>
          </div>

          {/* Filters */}
          <div className="glass-card rounded-2xl p-6 mb-8">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="search">Search</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by name, handle, or skills..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex items-end">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hireable"
                    checked={hireableOnly}
                    onCheckedChange={(checked) => setHireableOnly(checked as boolean)}
                  />
                  <Label htmlFor="hireable" className="cursor-pointer">
                    Available for hire only
                  </Label>
                </div>
              </div>
            </div>
          </div>

          {/* Profiles Grid */}
          {loading ? (
            <div className="text-center py-20 text-muted-foreground">
              Loading profiles...
            </div>
          ) : filteredProfiles.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              No profiles found. Try adjusting your filters.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProfiles.map((profile) => (
                <ProfileCard
                  key={profile.id}
                  handle={profile.handle}
                  displayName={profile.display_name}
                  skills={profile.skills}
                  hireable={profile.hireable}
                  avatarUrl={profile.avatar_url}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default People;
