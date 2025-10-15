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
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { DollarSign, Calendar, MessageSquare, Package } from "lucide-react";

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
  const [incomingRequests, setIncomingRequests] = useState<ServiceRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileId, setProfileId] = useState<string | null>(null);

  useEffect(() => {
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
      toast({
        title: "Success",
        description: "Request status updated",
      });
      fetchRequests();
    }
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
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Link
              to={`/services/${request.service_id}`}
              className="text-lg font-semibold hover:text-primary transition-colors"
            >
              {request.services?.title}
            </Link>
            {getStatusBadge(request.status)}
          </div>
          <p className="text-sm text-muted-foreground">
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
            <div className="flex items-center gap-2 text-sm">
              <MessageSquare className="h-4 w-4" />
              <span className="font-medium">{request.selected_contact_method}:</span>
              <span className="text-primary">{request.contact_info}</span>
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

      {isIncoming && request.status === "pending" && (
        <div className="flex gap-2 pt-2 border-t">
          <Select
            value={request.status}
            onValueChange={(value) => updateRequestStatus(request.id, value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="accepted">Accept</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="rejected">Reject</SelectItem>
            </SelectContent>
          </Select>
        </div>
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

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="pt-32 pb-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Service Requests</h1>

          <Tabs defaultValue="incoming" className="space-y-6">
            <TabsList>
              <TabsTrigger value="incoming">
                Incoming ({incomingRequests.length})
              </TabsTrigger>
              <TabsTrigger value="outgoing">
                Outgoing ({outgoingRequests.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="incoming" className="space-y-4">
              {incomingRequests.length === 0 ? (
                <Card className="p-12 text-center">
                  <p className="text-muted-foreground">No incoming requests yet</p>
                </Card>
              ) : (
                incomingRequests.map((request) => (
                  <RequestCard key={request.id} request={request} isIncoming={true} />
                ))
              )}
            </TabsContent>

            <TabsContent value="outgoing" className="space-y-4">
              {outgoingRequests.length === 0 ? (
                <Card className="p-12 text-center">
                  <p className="text-muted-foreground">No outgoing requests yet</p>
                </Card>
              ) : (
                outgoingRequests.map((request) => (
                  <RequestCard key={request.id} request={request} isIncoming={false} />
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default ServiceRequests;
