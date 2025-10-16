import { useState, useEffect } from "react";
import { useParams, useNavigate, Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  Briefcase,
  User,
  Pencil,
  Trash2,
  Package,
  Star
} from "lucide-react";
import { ReportButton } from "@/components/ReportButton";
import { ServiceReviewForm } from "@/components/ServiceReviewForm";
import { ServiceReviewCard } from "@/components/ServiceReviewCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  price_amount: number | null;
  currency: string;
  pricing_type: string;
  delivery_time: number | null;
  features: any[];
  requirements: string | null;
  images: any;
  profile_id: string;
  contact_methods?: any[];
  accepted_payment_methods?: any[];
  profiles: {
    handle: string;
    display_name: string;
    avatar_url: string | null;
    bio: string | null;
    user_id: string;
  };
}

const ServiceDetail = () => {
  const { serviceId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [selectedContactMethod, setSelectedContactMethod] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewRequest, setReviewRequest] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (serviceId) {
      fetchService();
      fetchReviews();
      checkReviewRequest();
      checkAdminStatus();
    }
  }, [serviceId]);

  const checkAdminStatus = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id);

    const hasAdminRole = roles?.some(r => ['owner', 'admin', 'moderator'].includes(r.role));
    setIsAdmin(hasAdminRole || false);
  };

  const fetchReviews = async () => {
    const { data, error } = await supabase
      .from("service_reviews")
      .select(`
        id,
        rating,
        comment,
        created_at,
        profiles!service_reviews_reviewer_id_fkey (
          display_name,
          handle,
          avatar_url
        )
      `)
      .eq("service_id", serviceId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setReviews(data as any);
      if (data.length > 0) {
        const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
        setAvgRating(Math.round(avg * 10) / 10);
      }
    }
  };

  const checkReviewRequest = async () => {
    const reviewId = searchParams.get('review');
    if (!reviewId) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: request } = await supabase
      .from("service_requests")
      .select("*, services(profiles(id))")
      .eq("id", reviewId)
      .eq("requester_id", session.user.id)
      .eq("status", "completed")
      .maybeSingle();

    if (request) {
      setReviewRequest(request);
      setShowReviewDialog(true);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    const { error } = await supabase
      .from("service_reviews")
      .delete()
      .eq("id", reviewId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete review",
        variant: "destructive",
      });
    } else {
      toast({ title: "Review deleted" });
      fetchReviews();
    }
  };

  const fetchService = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("services")
      .select(`
        *,
        profiles!inner(handle, display_name, avatar_url, bio, user_id)
      `)
      .eq("id", serviceId)
      .eq("active", true)
      .maybeSingle();

    if (error) {
      console.error("Error fetching service:", error);
      toast({
        title: "Error",
        description: "Could not load service details",
        variant: "destructive",
      });
    } else {
      setService(data as any);
      if (data.price_amount) {
        setBudget(data.price_amount.toString());
      }

      // Check if current user is the owner
      const { data: { session } } = await supabase.auth.getSession();
      if (session && (data as any).profiles.user_id === session.user.id) {
        setIsOwner(true);
      }
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!service) return;
    
    setDeleting(true);
    const { error } = await supabase
      .from("services")
      .delete()
      .eq("id", service.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete service",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Service deleted successfully",
      });
      navigate("/services");
    }
    setDeleting(false);
  };

  const handleRequestService = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      toast({
        title: "Authentication required",
        description: "Please log in to request a service",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    if (!description.trim()) {
      toast({
        title: "Description required",
        description: "Please describe what you need",
        variant: "destructive",
      });
      return;
    }

    if (!selectedContactMethod || !contactInfo.trim()) {
      toast({
        title: "Contact info required",
        description: "Please select a contact method and provide your contact information",
        variant: "destructive",
      });
      return;
    }

    setRequesting(true);

    const { error } = await supabase
      .from("service_requests")
      .insert({
        service_id: serviceId,
        seller_profile_id: service!.profile_id,
        requester_id: session.user.id,
        description: description.trim(),
        budget: budget ? parseFloat(budget) : null,
        deadline: deadline || null,
        selected_contact_method: selectedContactMethod,
        contact_info: contactInfo.trim(),
        selected_payment_method: selectedPaymentMethod || null,
        status: "pending"
      });

    if (error) {
      console.error("Error creating request:", error);
      toast({
        title: "Error",
        description: "Could not create service request",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Request sent!",
        description: "The seller will review your request and contact you soon.",
      });
      navigate("/service-requests");
    }

    setRequesting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-32 pb-20 px-4 text-center">
          <p className="text-muted-foreground">Loading service...</p>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-32 pb-20 px-4 text-center">
          <p className="text-muted-foreground">Service not found</p>
          <Button asChild className="mt-4">
            <Link to="/services">Browse Services</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="pt-32 pb-20 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Back Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/services")}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Services
          </Button>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Service Header */}
              <div>
                <div className="flex items-start justify-between mb-3">
                  <Badge variant="outline">
                    {service.category}
                  </Badge>
                  
                  {isOwner && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/services/${service.id}/edit`)}
                      >
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/service-requests?service=${serviceId}`)}
                      >
                        <Package className="h-4 w-4 mr-2" />
                        View Requests
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" disabled={deleting}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Service?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete your service
                              and all associated requests.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                              Delete Service
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
                <h1 className="text-4xl font-bold mb-4">{service.title}</h1>
                
                {/* Seller Info */}
                <Link
                  to={`/${service.profiles.handle}`}
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity w-fit"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                    {service.profiles.avatar_url ? (
                      <img
                        src={service.profiles.avatar_url}
                        alt={service.profiles.display_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold">{service.profiles.display_name}</p>
                    <p className="text-sm text-muted-foreground">@{service.profiles.handle}</p>
                  </div>
                </Link>
              </div>

              {/* Service Image */}
              {service.images?.[0] && (
                <div className="aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5">
                  <img
                    src={service.images[0]}
                    alt={service.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Description */}
                 <Card className="p-6">
                   <h2 className="text-xl font-bold mb-4">About This Service</h2>
                   <p className="text-muted-foreground whitespace-pre-wrap">
                     {service.description}
                   </p>
                   <div className="pt-4">
                     <ReportButton targetType="service" targetId={service.id} />
                   </div>
                 </Card>

              {/* Features */}
              {service.features && service.features.length > 0 && (
                <Card className="p-6">
                  <h2 className="text-xl font-bold mb-4">What's Included</h2>
                  <ul className="space-y-3">
                    {service.features.map((feature: string, index: number) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {/* Requirements */}
              {service.requirements && (
                <Card className="p-6">
                  <h2 className="text-xl font-bold mb-4">Requirements</h2>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {service.requirements}
                  </p>
                </Card>
              )}

              {/* Reviews */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold">Reviews</h2>
                    {reviews.length > 0 && (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= avgRating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-muted-foreground"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {avgRating} ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {reviews.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No reviews yet. Be the first to review this service!
                  </p>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <ServiceReviewCard
                        key={review.id}
                        review={review}
                        isAdmin={isAdmin}
                        onDelete={handleDeleteReview}
                      />
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* Sidebar - Order Form */}
            <div className="lg:col-span-1">
              <Card className="p-6 sticky top-24">
                <div className="space-y-4">
                  {/* Pricing */}
                  <div>
                    <div className="flex items-baseline gap-2 mb-2">
                      <DollarSign className="w-5 h-5 text-primary" />
                      <span className="text-3xl font-bold">
                        {service.price_amount 
                          ? `${service.currency} ${service.price_amount}`
                          : service.pricing_type}
                      </span>
                    </div>
                    {service.delivery_time && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">{service.delivery_time} days delivery</span>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Request Form */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="description">Describe Your Needs*</Label>
                      <Textarea
                        id="description"
                        placeholder="Tell the seller what you need..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                        className="mt-1"
                      />
                    </div>

                    {service.contact_methods && Array.isArray(service.contact_methods) && service.contact_methods.length > 0 && (
                      <div>
                        <Label htmlFor="contactMethod">How should they contact you?*</Label>
                        <select
                          id="contactMethod"
                          value={selectedContactMethod}
                          onChange={(e) => setSelectedContactMethod(e.target.value)}
                          className="w-full mt-1 px-3 py-2 rounded-md border bg-background"
                          required
                        >
                          <option value="">Select contact method</option>
                          {service.contact_methods.map((cm: any, idx: number) => (
                            <option key={idx} value={cm.type}>
                              {cm.type}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {selectedContactMethod && (
                      <div>
                        <Label htmlFor="contactInfo">Your {selectedContactMethod}*</Label>
                        <Input
                          id="contactInfo"
                          placeholder={`Enter your ${selectedContactMethod} username/info`}
                          value={contactInfo}
                          onChange={(e) => setContactInfo(e.target.value)}
                          className="mt-1"
                          required
                        />
                      </div>
                    )}

                    {service.accepted_payment_methods && Array.isArray(service.accepted_payment_methods) && service.accepted_payment_methods.length > 0 && (
                      <div>
                        <Label htmlFor="paymentMethod">Preferred Payment Method</Label>
                        <select
                          id="paymentMethod"
                          value={selectedPaymentMethod}
                          onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                          className="w-full mt-1 px-3 py-2 rounded-md border bg-background"
                        >
                          <option value="">Select payment method</option>
                          {service.accepted_payment_methods.map((pm: any, idx: number) => (
                            <option key={idx} value={pm.method}>
                              {pm.method}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <Label htmlFor="budget">Budget (Optional)</Label>
                      <div className="relative mt-1">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="budget"
                          type="number"
                          placeholder="Enter amount"
                          value={budget}
                          onChange={(e) => setBudget(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="deadline">Deadline (Optional)</Label>
                      <Input
                        id="deadline"
                        type="date"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    <Button
                      onClick={handleRequestService}
                      disabled={requesting}
                      className="w-full"
                      size="lg"
                    >
                      <Briefcase className="w-5 h-5 mr-2" />
                      {requesting ? "Sending..." : "Request Service"}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                      By requesting, you agree to our Terms of Service
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rate this Service</DialogTitle>
          </DialogHeader>
          {reviewRequest && service && (
            <ServiceReviewForm
              serviceId={service.id}
              serviceRequestId={reviewRequest.id}
              sellerProfileId={service.profile_id}
              onSuccess={() => {
                setShowReviewDialog(false);
                fetchReviews();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServiceDetail;
