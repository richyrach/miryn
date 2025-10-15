import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, X, Briefcase } from "lucide-react";
import { z } from "zod";

const serviceSchema = z.object({
  title: z.string().min(10, "Title must be at least 10 characters").max(100),
  description: z.string().min(50, "Description must be at least 50 characters").max(2000),
  category: z.string().min(2, "Category is required").max(50),
  pricing_type: z.enum(["fixed", "hourly", "custom"]),
  price_amount: z.number().positive().optional(),
  delivery_time: z.number().int().positive().optional(),
});

const NewService = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profileId, setProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [pricingType, setPricingType] = useState<"fixed" | "hourly" | "custom">("fixed");
  const [priceAmount, setPriceAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [requirements, setRequirements] = useState("");
  const [features, setFeatures] = useState<string[]>([""]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create a service",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    // Get profile ID
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", session.user.id)
      .single();

    if (profile) {
      setProfileId(profile.id);
    }
  };

  const handleAddFeature = () => {
    setFeatures([...features, ""]);
  };

  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...features];
    newFeatures[index] = value;
    setFeatures(newFeatures);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profileId) {
      toast({
        title: "Error",
        description: "Profile not found. Please try again.",
        variant: "destructive",
      });
      return;
    }

    // Validate
    try {
      serviceSchema.parse({
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
        pricing_type: pricingType,
        price_amount: priceAmount ? parseFloat(priceAmount) : undefined,
        delivery_time: deliveryTime ? parseInt(deliveryTime) : undefined,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("services")
      .insert({
        profile_id: profileId,
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
        pricing_type: pricingType,
        price_amount: priceAmount ? parseFloat(priceAmount) : null,
        currency,
        delivery_time: deliveryTime ? parseInt(deliveryTime) : null,
        requirements: requirements.trim() || null,
        features: features.filter(f => f.trim()),
        active: true,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating service:", error);
      toast({
        title: "Error",
        description: "Failed to create service. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success!",
        description: "Your service has been created and is now live.",
      });
      navigate(`/services/${data.id}`);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="pt-32 pb-20 px-4">
        <div className="max-w-3xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/services")}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Services
          </Button>

          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Briefcase className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Create New Service</span>
            </div>
            <h1 className="text-4xl font-bold mb-2">List Your Service</h1>
            <p className="text-muted-foreground">
              Create a service listing to showcase what you offer to potential clients
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="p-6 space-y-6">
              {/* Title */}
              <div>
                <Label htmlFor="title">Service Title*</Label>
                <Input
                  id="title"
                  placeholder="e.g., Professional Website Development"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  maxLength={100}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {title.length}/100 characters
                </p>
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Description*</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your service in detail. What will clients get? What makes your service unique?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={6}
                  maxLength={2000}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {description.length}/2000 characters
                </p>
              </div>

              {/* Category */}
              <div>
                <Label htmlFor="category">Category*</Label>
                <div className="mt-1">
                  <select
                    id="category"
                    className="w-full rounded-md border bg-background px-3 py-2"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                  >
                    <option value="">Select a category</option>
                    {[
                      "Web Development",
                      "Design",
                      "Marketing",
                      "AI & Data",
                      "Writing & Translation",
                      "Video & Animation",
                      "Music & Audio",
                      "Consulting"
                    ].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            </Card>

            <Card className="p-6 space-y-6">
              <h2 className="text-xl font-bold">Pricing</h2>

              {/* Pricing Type */}
              <div>
                <Label>Pricing Type*</Label>
                <div className="grid grid-cols-3 gap-3 mt-2">
                  {[
                    { value: "fixed", label: "Fixed Price" },
                    { value: "hourly", label: "Hourly Rate" },
                    { value: "custom", label: "Custom Quote" },
                  ].map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setPricingType(type.value as any)}
                      className={`px-4 py-3 rounded-lg border-2 transition-all ${
                        pricingType === type.value
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Amount */}
              {pricingType !== "custom" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">
                      {pricingType === "fixed" ? "Price*" : "Hourly Rate*"}
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={priceAmount}
                      onChange={(e) => setPriceAmount(e.target.value)}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Input
                      id="currency"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      maxLength={3}
                      className="mt-1"
                    />
                  </div>
                </div>
              )}

              {/* Delivery Time */}
              <div>
                <Label htmlFor="delivery">Delivery Time (days)</Label>
                <Input
                  id="delivery"
                  type="number"
                  placeholder="e.g., 7"
                  value={deliveryTime}
                  onChange={(e) => setDeliveryTime(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  How many days will it take to complete the service?
                </p>
              </div>
            </Card>

            <Card className="p-6 space-y-6">
              <h2 className="text-xl font-bold">What's Included</h2>
              
              <div className="space-y-3">
                {features.map((feature, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="e.g., Responsive design, SEO optimization"
                      value={feature}
                      onChange={(e) => handleFeatureChange(index, e.target.value)}
                      className="flex-1"
                    />
                    {features.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleRemoveFeature(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddFeature}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Feature
                </Button>
              </div>
            </Card>

            <Card className="p-6 space-y-4">
              <h2 className="text-xl font-bold">Requirements</h2>
              <div>
                <Label htmlFor="requirements">What do you need from clients?</Label>
                <Textarea
                  id="requirements"
                  placeholder="e.g., Logo files, brand guidelines, content copy, etc."
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  rows={4}
                  maxLength={1000}
                  className="mt-1"
                />
              </div>
            </Card>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/services")}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? "Creating..." : "Create Service"}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default NewService;
