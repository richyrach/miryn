import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Link, useSearchParams } from "react-router-dom";
import { DollarSign, Calendar, MessageSquare, Package, Copy, Clock, CheckCircle, XCircle, PlayCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ServiceRequest {
  id: string;
  service_id: string;
  description: string;
  budget: number | null;
  deadline: string | null;
  status: string;
  selected_contact_method: string | null;
  contact_info: string | null;
  selected_payment_method: string | null;
  created_at: string;
  services: {
    title: string;
  };
  requester_profile: {
    handle: string;
    display_name: string;
    avatar_url: string | null;
  };
  seller_profile: {
    handle: string;
    display_name: string;
  };
}

const ServiceRequests = () => {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [incomingRequests, setIncomingRequests] = useState<ServiceRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [userServices, setUserServices] = useState<Array<{ id: string; title: string }>>([]);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; requestId: string; status: string; title: string }>({
    open: false,
    requestId: "",
    status: "",
    title: "",
  });

  useEffect(() => {
    const serviceParam = searchParams.get("service");
    if (serviceParam) {
      setServiceFilter(serviceParam);
    }
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", session.user.id)
      .single();

    if (!profile) return;
    setProfileId(profile.id);

    // Fetch user's services for filter dropdown
    const { data: services } = await supabase
      .from("services")
      .select("id, title")
      .eq("profile_id", profile.id)
      .eq("active", true);
    
    setUserServices(services || []);

    // Fetch incoming requests (for services I own)
    const { data: incoming } = await supabase
      .from("service_requests")
      .select(`
        *,
        services!inner(title),
        requester_profile:profiles!service_requests_requester_id_fkey(handle, display_name, avatar_url)
      `)
      .eq("seller_profile_id", profile.id)
      .order("created_at", { ascending: false });

    setIncomingRequests((incoming as any) || []);

    // Fetch outgoing requests (requests I made)
    const { data: outgoing } = await supabase
      .from("service_requests")
      .select(`
        *,
        services!inner(title),
        seller_profile:profiles!service_requests_seller_profile_id_fkey(handle, display_name)
      `)
      .eq("requester_id", session.user.id)
      .order("created_at", { ascending: false });

    setOutgoingRequests((outgoing as any) || []);
    setLoading(false);
  };

  const handleStatusUpdate = (requestId: string, newStatus: string, serviceTitle: string) => {
    // Show confirmation for destructive actions
    if (newStatus === "rejected" || newStatus === "completed") {
      setConfirmDialog({
        open: true,
        requestId,
        status: newStatus,
        title: serviceTitle,
      });
    } else {
      updateRequestStatus(requestId, newStatus);
    }
  };

  const updateRequestStatus = async (requestId: string, newStatus: string) => {
    const { error } = await supabase
      .from("service_requests")
      .update({ status: newStatus })
      .eq("id", requestId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update request status",
        variant: "destructive",
      });
    } else {
      const statusMessages: Record<string, string> = {
        accepted: "Request accepted!",
        rejected: "Request rejected",
        in_progress: "Status updated to In Progress",
        completed: "Request marked as complete",
      };
      
      toast({
        title: "Success",
        description: statusMessages[newStatus] || "Request status updated",
      });
      fetchRequests();
    }
    
    setConfirmDialog({ open: false, requestId: "", status: "", title: "" });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Contact info copied to clipboard",
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "outline",
      accepted: "default",
      in_progress: "secondary",
      completed: "default",
      rejected: "destructive",
    };

    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const RequestCard = ({ request, isIncoming }: { request: ServiceRequest; isIncoming: boolean }) => (
    <Card className="p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        {isIncoming && request.requester_profile && (
          <Avatar className="h-12 w-12">
            <AvatarImage src={request.requester_profile.avatar_url || undefined} />
            <AvatarFallback>{request.requester_profile.display_name?.[0] || "?"}</AvatarFallback>
          </Avatar>
        )}
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Link
              to={`/services/${request.service_id}`}
              className="text-lg font-semibold hover:text-primary transition-colors"
            >
              {request.services?.title}
            </Link>
            {getStatusBadge(request.status)}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            {isIncoming ? (
              <>
                Request from{" "}
                <Link to={`/${request.requester_profile?.handle}`} className="text-primary hover:underline">
                  @{request.requester_profile?.handle}
                </Link>
              </>
            ) : (
              <>
                Sent to{" "}
                <Link to={`/${request.seller_profile?.handle}`} className="text-primary hover:underline">
                  @{request.seller_profile?.handle}
                </Link>
              </>
            )}
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm">{request.description}</p>

        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {request.budget && (
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              <span>${request.budget}</span>
            </div>
          )}
          {request.deadline && (
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{new Date(request.deadline).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {isIncoming && request.contact_info && (
          <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
            <h4 className="font-semibold text-sm">Contact Information</h4>
            <div className="flex items-center justify-between gap-2 text-sm">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span className="font-medium">{request.selected_contact_method}:</span>
                <span className="text-primary">{request.contact_info}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(request.contact_info!)}
                className="h-8 w-8 p-0"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            {request.selected_payment_method && (
              <div className="flex items-center gap-2 text-sm">
                <Package className="h-4 w-4" />
                <span className="font-medium">Payment:</span>
                <span>{request.selected_payment_method}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {isIncoming && request.status !== "completed" && request.status !== "rejected" && (
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          {request.status === "pending" && (
            <>
              <Button
                onClick={() => handleStatusUpdate(request.id, "accepted", request.services?.title)}
                variant="default"
                size="sm"
                className="flex items-center gap-1"
              >
                <CheckCircle className="h-4 w-4" />
                Accept Request
              </Button>
              <Button
                onClick={() => handleStatusUpdate(request.id, "rejected", request.services?.title)}
                variant="destructive"
                size="sm"
                className="flex items-center gap-1"
              >
                <XCircle className="h-4 w-4" />
                Reject
              </Button>
            </>
          )}
          
          {request.status === "accepted" && (
            <Button
              onClick={() => updateRequestStatus(request.id, "in_progress")}
              variant="default"
              size="sm"
              className="flex items-center gap-1"
            >
              <PlayCircle className="h-4 w-4" />
              Start Working
            </Button>
          )}
          
          {request.status === "in_progress" && (
            <Button
              onClick={() => handleStatusUpdate(request.id, "completed", request.services?.title)}
              variant="default"
              size="sm"
              className="flex items-center gap-1"
            >
              <CheckCircle className="h-4 w-4" />
              Mark as Complete
            </Button>
          )}
          
          <Select
            value={request.status}
            onValueChange={(value) => handleStatusUpdate(request.id, value, request.services?.title)}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      
      {!isIncoming && request.status === "completed" && (
        <Link to={`/services/${request.service_id}?review=${request.id}`} className="mt-2">
          <Button variant="outline" size="sm">
            Rate this Service
          </Button>
        </Link>
      )}
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-32 text-center">Loading...</div>
      </div>
    );
  }

  const filteredIncoming = incomingRequests.filter((req) => {
    if (statusFilter !== "all" && req.status !== statusFilter) return false;
    if (serviceFilter !== "all" && req.service_id !== serviceFilter) return false;
    return true;
  });

  const filteredOutgoing = outgoingRequests.filter((req) => {
    if (statusFilter !== "all" && req.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="pt-32 pb-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Service Requests</h1>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Filter by service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                {userServices.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(statusFilter !== "all" || serviceFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStatusFilter("all");
                  setServiceFilter("all");
                  setSearchParams({});
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>

          <Tabs defaultValue="incoming" className="space-y-6">
            <TabsList>
              <TabsTrigger value="incoming">
                Incoming ({filteredIncoming.length})
              </TabsTrigger>
              <TabsTrigger value="outgoing">
                Outgoing ({filteredOutgoing.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="incoming" className="space-y-4">
              {filteredIncoming.length === 0 ? (
                <Card className="p-12 text-center">
                  <p className="text-muted-foreground">
                    {statusFilter !== "all" || serviceFilter !== "all"
                      ? "No requests match your filters"
                      : "No incoming requests yet"}
                  </p>
                </Card>
              ) : (
                filteredIncoming.map((request) => (
                  <RequestCard key={request.id} request={request} isIncoming={true} />
                ))
              )}
            </TabsContent>

            <TabsContent value="outgoing" className="space-y-4">
              {filteredOutgoing.length === 0 ? (
                <Card className="p-12 text-center">
                  <p className="text-muted-foreground">
                    {statusFilter !== "all"
                      ? "No requests match your filters"
                      : "No outgoing requests yet"}
                  </p>
                </Card>
              ) : (
                filteredOutgoing.map((request) => (
                  <RequestCard key={request.id} request={request} isIncoming={false} />
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog({ ...confirmDialog, open: false })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.status === "rejected" ? "Reject Request?" : "Mark as Complete?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.status === "rejected"
                ? `Are you sure you want to reject the request for "${confirmDialog.title}"? This action cannot be undone.`
                : `Are you sure you want to mark the request for "${confirmDialog.title}" as complete?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => updateRequestStatus(confirmDialog.requestId, confirmDialog.status)}
              className={confirmDialog.status === "rejected" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ServiceRequests;
