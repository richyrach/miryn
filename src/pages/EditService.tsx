import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Briefcase, Pencil } from "lucide-react";
import { z } from "zod";

const serviceSchema = z.object({
  title: z.string().min(10).max(100),
  description: z.string().min(50).max(2000),
  category: z.string().min(2).max(50),
  pricing_type: z.enum(["fixed", "hourly", "custom"]),
  price_amount: z.number().positive().optional(),
  delivery_time: z.number().int().positive().optional(),
});

const EditService = () => {
  const navigate = useNavigate();
  const { serviceId } = useParams();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [pricingType, setPricingType] = useState<"fixed" | "hourly" | "custom">("fixed");
  const [priceAmount, setPriceAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [requirements, setRequirements] = useState("");
  const [features, setFeatures] = useState<string[]>([]);
  const [contactMethods, setContactMethods] = useState<string[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);

  useEffect(() => {
    loadService();
  }, [serviceId]);

  const loadService = async () => {
    if (!serviceId) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({ title: "Authentication required", description: "Please sign in", variant: "destructive" });
      navigate("/auth");
      return;
    }

    const { data: userProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", session.user.id)
      .maybeSingle();

    const { data: service, error } = await supabase
      .from("services")
      .select("*")
      .eq("id", serviceId)
      .maybeSingle();

    if (error || !service) {
      toast({ title: "Not found", description: "Service not found", variant: "destructive" });
      navigate("/services");
      return;
    }

    if (!userProfile || service.profile_id !== userProfile.id) {
      toast({ title: "Access denied", description: "You can only edit your own service", variant: "destructive" });
      navigate(`/services/${serviceId}`);
      return;
    }

    setIsOwner(true);

    // Prefill
    setTitle(service.title || "");
    setDescription(service.description || "");
    setCategory(service.category || "");
    setPricingType((service.pricing_type as any) || "fixed");
    setPriceAmount(service.price_amount ? String(service.price_amount) : "");
    setCurrency(service.currency || "USD");
    setDeliveryTime(service.delivery_time ? String(service.delivery_time) : "");
    setRequirements(service.requirements || "");
    setFeatures(Array.isArray(service.features) ? (service.features as any[]).map((f) => String(f)) : []);
    setContactMethods(Array.isArray(service.contact_methods) ? service.contact_methods.map((c: any) => c.type || c) : []);
    setPaymentMethods(Array.isArray(service.accepted_payment_methods) ? service.accepted_payment_methods.map((p: any) => p.method || p) : []);

    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceId) return;

    try {
      serviceSchema.parse({
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
        pricing_type: pricingType,
        price_amount: priceAmount ? parseFloat(priceAmount) : undefined,
        delivery_time: deliveryTime ? parseInt(deliveryTime) : undefined,
      });
    } catch (err) {
      toast({ title: "Validation error", description: "Please check your inputs", variant: "destructive" });
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("services")
      .update({
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
        pricing_type: pricingType,
        price_amount: priceAmount ? parseFloat(priceAmount) : null,
        currency,
        delivery_time: deliveryTime ? parseInt(deliveryTime) : null,
        requirements: requirements.trim() || null,
        features: features.filter(f => f.trim()),
        contact_methods: contactMethods.map(m => ({ type: m, required: true })),
        accepted_payment_methods: paymentMethods.map(m => ({ method: m })),
      })
      .eq("id", serviceId);

    if (error) {
      toast({ title: "Error", description: "Failed to save changes", variant: "destructive" });
    } else {
      toast({ title: "Saved", description: "Service updated successfully" });
      navigate(`/services/${serviceId}`);
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-32 text-center">Loading...</div>
      </div>
    );
  }

  if (!isOwner) return null;

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="pt-32 pb-20 px-4">
        <div className="max-w-3xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/services/${serviceId}`)}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Service
          </Button>

          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Pencil className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Edit Service</span>
            </div>
            <h1 className="text-4xl font-bold mb-2">Update Your Service</h1>
            <p className="text-muted-foreground">Make changes and keep your service up to date.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="p-6 space-y-6">
              <div>
                <Label htmlFor="title">Service Title*</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={100} className="mt-1" />
                <p className="text-xs text-muted-foreground mt-1">{title.length}/100 characters</p>
              </div>

              <div>
                <Label htmlFor="description">Description*</Label>
                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} required rows={6} maxLength={2000} className="mt-1" />
                <p className="text-xs text-muted-foreground mt-1">{description.length}/2000 characters</p>
              </div>

              <div>
                <Label htmlFor="category">Category*</Label>
                <div className="mt-1">
                  <select id="category" className="w-full rounded-md border bg-background px-3 py-2" value={category} onChange={(e) => setCategory(e.target.value)} required>
                    <option value="">Select a category</option>
                    {["Web Development","Design","Marketing","AI & Data","Writing & Translation","Video & Animation","Music & Audio","Consulting"].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            </Card>

            <Card className="p-6 space-y-6">
              <h2 className="text-xl font-bold">Pricing</h2>
              <div>
                <Label>Pricing Type*</Label>
                <div className="grid grid-cols-3 gap-3 mt-2">
                  {[{ value: "fixed", label: "Fixed Price" },{ value: "hourly", label: "Hourly Rate" },{ value: "custom", label: "Custom Quote" }].map((type) => (
                    <button key={type.value} type="button" onClick={() => setPricingType(type.value as any)} className={`px-4 py-3 rounded-lg border-2 transition-all ${pricingType === type.value ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}>
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {pricingType !== "custom" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">{pricingType === "fixed" ? "Price*" : "Hourly Rate*"}</Label>
                    <Input id="price" type="number" step="0.01" value={priceAmount} onChange={(e) => setPriceAmount(e.target.value)} required className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Input id="currency" value={currency} onChange={(e) => setCurrency(e.target.value)} maxLength={3} className="mt-1" />
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="delivery">Delivery Time (days)</Label>
                <Input id="delivery" type="number" value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)} className="mt-1" />
                <p className="text-xs text-muted-foreground mt-1">How many days will it take to complete the service?</p>
              </div>
            </Card>

            <Card className="p-6 space-y-6">
              <h2 className="text-xl font-bold">What's Included</h2>
              <div className="space-y-3">
                {features.map((feature, index) => (
                  <div key={index} className="flex gap-2">
                    <Input value={feature} onChange={(e) => {
                      const next = [...features];
                      next[index] = e.target.value;
                      setFeatures(next);
                    }} className="flex-1" />
                    <Button type="button" variant="outline" size="sm" onClick={() => setFeatures(features.filter((_, i) => i !== index))}>Remove</Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={() => setFeatures([...features, ""]) } className="w-full">Add Feature</Button>
              </div>
            </Card>

            <Card className="p-6 space-y-4">
              <h2 className="text-xl font-bold">Contact Methods</h2>
              <div className="grid grid-cols-2 gap-3">
                {['Discord','WhatsApp','Instagram','Email','Telegram','Twitter'].map(method => (
                  <label key={method} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={contactMethods.includes(method)} onChange={(e) => {
                      if (e.target.checked) setContactMethods([...contactMethods, method]);
                      else setContactMethods(contactMethods.filter(m => m !== method));
                    }} className="rounded" />
                    <span className="text-sm">{method}</span>
                  </label>
                ))}
              </div>
            </Card>

            <Card className="p-6 space-y-4">
              <h2 className="text-xl font-bold">Accepted Payment Methods</h2>
              <div className="grid grid-cols-2 gap-3">
                {['PayPal','Stripe/Card','Cryptocurrency','Bank Transfer','Cash','Other'].map(method => (
                  <label key={method} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={paymentMethods.includes(method)} onChange={(e) => {
                      if (e.target.checked) setPaymentMethods([...paymentMethods, method]);
                      else setPaymentMethods(paymentMethods.filter(m => m !== method));
                    }} className="rounded" />
                    <span className="text-sm">{method}</span>
                  </label>
                ))}
              </div>
            </Card>

            <Card className="p-6 space-y-4">
              <h2 className="text-xl font-bold">Requirements</h2>
              <div>
                <Label htmlFor="requirements">What do you need from clients?</Label>
                <Textarea id="requirements" value={requirements} onChange={(e) => setRequirements(e.target.value)} rows={4} maxLength={1000} className="mt-1" />
              </div>
            </Card>

            <div className="flex gap-4">
              <Button type="button" variant="outline" onClick={() => navigate(`/services/${serviceId}`)} className="flex-1">Cancel</Button>
              <Button type="submit" disabled={saving} className="flex-1">{saving ? "Saving..." : "Save Changes"}</Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default EditService;
