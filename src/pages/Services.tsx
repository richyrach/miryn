import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Search, Briefcase, DollarSign, Clock, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  price_amount: number | null;
  currency: string;
  pricing_type: string;
  delivery_time: number | null;
  images: any;
  profile_id: string;
  public_profiles: {
    handle: string;
    display_name: string;
    avatar_url: string | null;
  };
}

const Services = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("services")
      .select(`
        *,
        public_profiles!inner(handle, display_name, avatar_url)
      `)
      .eq("active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching services:", error);
    } else {
      setServices(data as any);
    }
    setLoading(false);
  };

  const filteredServices = services.filter((service) => {
    const matchesSearch = !searchQuery || 
      service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !categoryFilter ||
      service.category.toLowerCase().includes(categoryFilter.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(services.map(s => s.category))];

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Briefcase className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Professional Services</span>
            </div>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4">Browse Services</h1>
                <p className="text-muted-foreground text-lg">
                  Hire talented professionals for your next project
                </p>
              </div>
              <Button asChild className="btn-hero">
                <Link to="/services/new">
                  <Plus className="w-4 h-4 mr-2" />
                  List Service
                </Link>
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="glass-card rounded-2xl p-6 mb-8">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="search">Search Services</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by title or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
               <div>
                 <Label htmlFor="category">Category</Label>
                 <div className="mt-1">
                   <select
                     id="category"
                     className="w-full rounded-md border bg-background px-3 py-2"
                     value={categoryFilter}
                     onChange={(e) => setCategoryFilter(e.target.value)}
                   >
                     <option value="">All categories</option>
                     {categories.map((cat) => (
                       <option key={cat} value={cat}>{cat}</option>
                     ))}
                   </select>
                 </div>
               </div>
            </div>

            {categories.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="text-sm text-muted-foreground">Popular:</span>
                {categories.slice(0, 5).map((cat) => (
                  <Badge
                    key={cat}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary/10"
                    onClick={() => setCategoryFilter(cat)}
                  >
                    {cat}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Services Grid */}
          {loading ? (
            <div className="text-center py-20 text-muted-foreground">
              Loading services...
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              No services found. Try adjusting your filters.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServices.map((service) => (
                <Link
                  key={service.id}
                  to={`/services/${service.id}`}
                  className="block group"
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 h-full">
                    {/* Service Image */}
                    <div className="aspect-video bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center overflow-hidden">
                      {service.images?.[0] ? (
                        <img
                          src={service.images[0]}
                          alt={service.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <Briefcase className="w-16 h-16 text-primary/30" />
                      )}
                    </div>

                    <div className="p-6">
                      {/* Category Badge */}
                      <Badge variant="outline" className="mb-3">
                        {service.category}
                      </Badge>

                      {/* Title */}
                      <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {service.title}
                      </h3>

                      {/* Description */}
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                        {service.description}
                      </p>

                      {/* Seller Info */}
                      <div className="flex items-center gap-2 mb-4 pb-4 border-b">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                          {service.public_profiles.avatar_url ? (
                            <img
                              src={service.public_profiles.avatar_url}
                              alt={service.public_profiles.display_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xs font-medium text-primary">
                              {service.public_profiles.display_name[0]}
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-medium">
                          {service.public_profiles.display_name}
                        </span>
                      </div>

                      {/* Pricing & Delivery */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-sm">
                          <DollarSign className="w-4 h-4 text-primary" />
                          <span className="font-bold">
                            {service.price_amount 
                              ? `${service.currency} ${service.price_amount}`
                              : service.pricing_type}
                          </span>
                        </div>
                        {service.delivery_time && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            <span>{service.delivery_time}d delivery</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Services;
