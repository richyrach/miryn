import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Shield, UserX, UserCheck, AlertTriangle, Ban, Clock, Megaphone, Trash2, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface UserWithWarnings {
  id: string;
  handle: string;
  display_name: string;
  user_id: string;
  roles: string[];
  warning_count: number;
}

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserWithWarnings[]>([]);
  const [bannedUsers, setBannedUsers] = useState<any[]>([]);
  const [warnings, setWarnings] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementMessage, setAnnouncementMessage] = useState("");
 
  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id);

    const hasAdminRole = roles?.some(r => ['owner', 'admin', 'moderator'].includes(r.role));
    
    if (!hasAdminRole) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive"
      });
      navigate("/");
      return;
    }

    // Get highest role for hierarchy checks
    const highestRole = roles?.sort((a, b) => {
      const roleOrder = { owner: 1, admin: 2, moderator: 3 };
      return (roleOrder[a.role as keyof typeof roleOrder] || 4) - (roleOrder[b.role as keyof typeof roleOrder] || 4);
    })[0]?.role;

    setCurrentUserRole(highestRole || null);
    setIsAdmin(true);
    fetchUsers();
    fetchBannedUsers();
    fetchWarnings();
    fetchReports();
    fetchAnnouncements();
    fetchFeedback();
    setLoading(false);
  };

  const fetchUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, handle, display_name, user_id, created_at")
      .order("created_at", { ascending: false });
    
    if (data) {
      // Get roles and warning counts for each user
      const usersWithData = await Promise.all(
        data.map(async (user) => {
          // Get roles
          const { data: rolesData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", user.user_id);

          // Get warning count
          const { data: warningData } = await supabase
            .from("user_warnings")
            .select("id")
            .eq("user_id", user.user_id);

          return {
            ...user,
            roles: rolesData?.map(r => r.role) || [],
            warning_count: warningData?.length || 0
          };
        })
      );

      setUsers(usersWithData);
    }
  };

  const fetchBannedUsers = async () => {
    const { data } = await supabase
      .from("banned_users")
      .select("*")
      .is("unbanned_at", null)
      .order("banned_at", { ascending: false });
    
    if (data) {
      // Get user details for each ban
      const bansWithUsers = await Promise.all(
        data.map(async (ban) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("handle, display_name")
            .eq("user_id", ban.user_id)
            .single();

          return {
            ...ban,
            handle: profile?.handle || "Unknown",
            display_name: profile?.display_name || "Unknown User"
          };
        })
      );

      setBannedUsers(bansWithUsers);
    }
  };

  const fetchWarnings = async () => {
    const { data } = await supabase
      .from("user_warnings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    
    if (data) {
      // Get user details
      const warningsWithUsers = await Promise.all(
        data.map(async (warning) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("handle, display_name")
            .eq("user_id", warning.user_id)
            .single();

          return {
            ...warning,
            handle: profile?.handle || "Unknown",
            display_name: profile?.display_name || "Unknown User"
          };
        })
      );

      setWarnings(warningsWithUsers);
    }
  };

  const fetchReports = async () => {
    const { data } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    setReports(data || []);
  };

  const fetchAnnouncements = async () => {
    const { data } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    setAnnouncements(data || []);
  };

  const updateReportStatus = async (id: string, status: "open" | "reviewing" | "resolved" | "dismissed") => {
    const { error } = await supabase
      .from("reports")
      .update({ status })
      .eq("id", id);
    if (!error) fetchReports();
  };

  const createAnnouncement = async () => {
    if (!announcementTitle.trim() || !announcementMessage.trim()) {
      toast({
        title: "Error",
        description: "Please fill in both title and message",
        variant: "destructive"
      });
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase
      .from("announcements")
      .insert({
        title: announcementTitle,
        message: announcementMessage,
        created_by: session.user.id,
        active: true
      });

    if (error) {
      console.error("Announcement creation error:", error);
      toast({
        title: "Failed to create announcement",
        description: error.message || "Unknown error occurred",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Announcement created and sent to all users"
      });
      setAnnouncementTitle("");
      setAnnouncementMessage("");
      fetchAnnouncements();
    }
  };

  const deactivateAnnouncement = async (id: string) => {
    const { error } = await supabase
      .from("announcements")
      .update({ active: false })
      .eq("id", id);

    if (!error) {
      toast({
        title: "Success",
        description: "Announcement deactivated"
      });
      fetchAnnouncements();
    }
  };

  // Check if current user can moderate target user based on role hierarchy
  const canModerateUser = (targetRoles: string[]): boolean => {
    if (!currentUserRole) return false;
    
    // If user has no roles, they can be moderated by anyone with a staff role
    if (targetRoles.length === 0) return true;
    
    const roleHierarchy = { owner: 1, admin: 2, moderator: 3, content_mod: 4, junior_mod: 5, support: 6, user: 7 };
    const currentLevel = roleHierarchy[currentUserRole as keyof typeof roleHierarchy] || 7;
    
    // Get the highest (lowest number) role of the target user
    const targetHighestLevel = Math.min(...targetRoles.map(r => roleHierarchy[r as keyof typeof roleHierarchy] || 7));
    
    // Owner can moderate anyone
    if (currentUserRole === 'owner') return true;
    
    // Admin can moderate moderators and other staff, but not owners or other admins
    if (currentUserRole === 'admin') {
      return targetHighestLevel > 2; // Can't moderate owner (1) or admin (2)
    }
    
    // Moderators can only moderate lower staff and regular users
    if (currentUserRole === 'moderator') {
      return targetHighestLevel > 3; // Can't moderate owner, admin, or moderator
    }
    
    return currentLevel < targetHighestLevel;
  };

  const adminUnpublishProject = async (projectId: string) => {
    const { error } = await supabase
      .from("projects")
      .update({ published: false })
      .eq("id", projectId);
    if (!error) {
      toast({ title: "Project unpublished" });
    }
  };

  const adminDeactivateService = async (serviceId: string) => {
    const { error } = await supabase
      .from("services")
      .update({ active: false })
      .eq("id", serviceId);
    if (!error) {
      toast({ title: "Service deactivated" });
    }
  };

  const adminDeleteService = async (serviceId: string) => {
    const { error } = await supabase
      .from("services")
      .delete()
      .eq("id", serviceId);
    if (!error) {
      toast({ title: "Service permanently deleted" });
    }
  };

  const handleDeleteFeedback = async (feedbackId: string) => {
    const { error } = await supabase
      .from("feedback")
      .delete()
      .eq("id", feedbackId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete feedback",
        variant: "destructive"
      });
    } else {
      toast({ title: "Feedback deleted successfully" });
      fetchFeedback();
    }
  };

  const handleDeleteUser = async (userId: string, handle: string) => {
    const { error } = await supabase.rpc('delete_user_account', {
      target_user_id: userId
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user account",
        variant: "destructive"
      });
    } else {
      toast({ 
        title: "Success",
        description: `User @${handle} and all their data has been permanently deleted`
      });
      fetchUsers();
    }
  };

  const handleWarnUser = async (userId: string, reason: string, severity: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    
    // Get actual user_id from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("id", userId)
      .single();

    if (!profile) {
      toast({
        title: "Error",
        description: "User not found",
        variant: "destructive"
      });
      return;
    }

    const { error } = await supabase
      .from("user_warnings")
      .insert({
        user_id: profile.user_id,
        warned_by: session?.user.id,
        reason,
        severity
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to warn user",
        variant: "destructive"
      });
    } else {
      toast({ title: "Warning issued successfully" });
      fetchUsers();
      fetchWarnings();
    }
  };

  const handleBanUser = async (userId: string, reason: string, duration: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    
    // Get actual user_id from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("id", userId)
      .single();

    if (!profile) {
      toast({
        title: "Error",
        description: "User not found",
        variant: "destructive"
      });
      return;
    }

    let expiresAt = null;
    if (duration !== 'permanent') {
      const now = new Date();
      switch (duration) {
        case '1day':
          expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
          break;
        case '3days':
          expiresAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
          break;
        case '7days':
          expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          break;
        case '30days':
          expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          break;
      }
    }

    const { error } = await supabase
      .from("banned_users")
      .insert({
        user_id: profile.user_id,
        banned_by: session?.user.id,
        reason,
        expires_at: expiresAt?.toISOString()
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to ban user",
        variant: "destructive"
      });
    } else {
      toast({ 
        title: "User banned successfully",
        description: duration === 'permanent' ? 'Permanent ban' : `Ban expires in ${duration}`
      });
      fetchUsers();
      fetchBannedUsers();
    }
  };

  const handleUnbanUser = async (userId: string) => {
    const { error } = await supabase
      .from("banned_users")
      .delete()
      .eq("user_id", userId)
      .is("unbanned_at", null);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to unban user",
        variant: "destructive"
      });
    } else {
      toast({ title: "User unbanned successfully" });
      fetchUsers();
      fetchBannedUsers();
    }
  };

  const handleAssignRole = async (userId: string, role: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    
    // Get actual user_id from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("id", userId)
      .maybeSingle();

    if (!profile) {
      toast({
        title: "Error",
        description: "User not found",
        variant: "destructive"
      });
      return;
    }

    const { error } = await supabase
      .from("user_roles")
      .insert([{
        user_id: profile.user_id,
        role: role as any,
        created_by: session?.user.id
      }]);

    if (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to assign role",
        variant: "destructive"
      });
    } else {
      toast({ title: `Role '${role}' assigned successfully` });
      fetchUsers();
    }
  };

  const handleRemoveRole = async (userUserId: string, role: string) => {
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userUserId)
      .eq("role", role as any);

    if (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove role",
        variant: "destructive"
      });
    } else {
      toast({ title: `Role '${role}' removed successfully` });
      fetchUsers();
    }
  };

  const fetchFeedback = async () => {
    const { data } = await supabase
      .from("feedback")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      const feedbackWithUsers = await Promise.all(
        data.map(async (item) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("handle, display_name")
            .eq("user_id", item.user_id)
            .maybeSingle();

          return {
            ...item,
            handle: profile?.handle || "Unknown",
            display_name: profile?.display_name || "Unknown User"
          };
        })
      );

      setFeedback(feedbackWithUsers);
    }
  };

  const updateFeedbackStatus = async (feedbackId: string, status: string) => {
    const { error } = await supabase
      .from("feedback")
      .update({ status: status as any })
      .eq("id", feedbackId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update feedback status",
        variant: "destructive"
      });
    } else {
      toast({ title: "Status updated successfully" });
      fetchFeedback();
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, { variant: any; className: string }> = {
      low: { variant: "secondary" as const, className: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
      medium: { variant: "secondary" as const, className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
      high: { variant: "secondary" as const, className: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
      critical: { variant: "destructive" as const, className: "" }
    };

    const config = variants[severity] || variants.low;
    return <Badge variant={config.variant} className={config.className}>{severity.toUpperCase()}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-32 text-center">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold">Admin Dashboard</h1>
          </div>

          <Tabs defaultValue="users" className="space-y-6">
            <TabsList className="grid w-full grid-cols-9 max-w-6xl">
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="bans">Bans</TabsTrigger>
              <TabsTrigger value="warnings">Warnings</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
              <TabsTrigger value="feedback">Feedback</TabsTrigger>
              <TabsTrigger value="announcements">
                <Megaphone className="w-4 h-4 mr-2" />
                Announcements
              </TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="comments">Comments</TabsTrigger>
            </TabsList>
 
            {/* Users Tab */}
            <TabsContent value="users">
              <div className="glass-card rounded-2xl p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold mb-4">All Users</h2>
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Handle</TableHead>
                        <TableHead>Display Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Warnings</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users
                        .filter(u =>
                          !userSearch ||
                          u.handle.toLowerCase().includes(userSearch.toLowerCase()) ||
                          u.display_name.toLowerCase().includes(userSearch.toLowerCase())
                        )
                        .map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>@{user.handle}</TableCell>
                          <TableCell>{user.display_name}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {user.roles.length === 0 ? (
                                <Badge variant="secondary">user</Badge>
                              ) : (
                                user.roles.map((role) => (
                                  <div key={role} className="flex items-center gap-1">
                                    <Badge variant="default" className="text-primary">
                                      {role}
                                    </Badge>
                                    {currentUserRole === 'owner' && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-5 w-5 p-0"
                                        onClick={() => handleRemoveRole(user.user_id, role)}
                                        title="Remove role"
                                      >
                                        <UserX className="w-3 h-3" />
                                      </Button>
                                    )}
                                  </div>
                                ))
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {user.warning_count > 0 && (
                              <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500">
                                {user.warning_count}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {/* Warn User */}
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="outline" disabled={!canModerateUser(user.roles)}>
                                    <AlertTriangle className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Warn User</DialogTitle>
                                    <DialogDescription>
                                      Issue a warning to @{user.handle}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <form onSubmit={(e) => {
                                    e.preventDefault();
                                    const formData = new FormData(e.currentTarget);
                                    const reason = formData.get("reason") as string;
                                    const severity = formData.get("severity") as string;
                                    handleWarnUser(user.id, reason, severity);
                                  }}>
                                    <div className="space-y-4 py-4">
                                      <div>
                                        <Label htmlFor="severity">Severity</Label>
                                        <Select name="severity" required defaultValue="low">
                                          <SelectTrigger className="mt-1">
                                            <SelectValue placeholder="Select severity" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="low">Low</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="high">High</SelectItem>
                                            <SelectItem value="critical">Critical</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div>
                                        <Label htmlFor="reason">Reason</Label>
                                        <Textarea
                                          id="reason"
                                          name="reason"
                                          placeholder="Reason for warning..."
                                          required
                                          className="mt-1"
                                        />
                                      </div>
                                    </div>
                                    <DialogFooter>
                                      <Button type="submit" variant="outline">
                                        Issue Warning
                                      </Button>
                                    </DialogFooter>
                                  </form>
                                </DialogContent>
                              </Dialog>

                              {/* Ban User */}
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="destructive" disabled={!canModerateUser(user.roles)}>
                                    <Ban className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Ban User</DialogTitle>
                                    <DialogDescription>
                                      Ban @{user.handle}? They won't be able to access the platform.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <form onSubmit={(e) => {
                                    e.preventDefault();
                                    const formData = new FormData(e.currentTarget);
                                    const reason = formData.get("reason") as string;
                                    const duration = formData.get("duration") as string;
                                    handleBanUser(user.id, reason, duration);
                                  }}>
                                    <div className="space-y-4 py-4">
                                      <div>
                                        <Label htmlFor="duration">Ban Duration</Label>
                                        <Select name="duration" required defaultValue="permanent">
                                          <SelectTrigger className="mt-1">
                                            <SelectValue placeholder="Select duration" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="1day">1 Day</SelectItem>
                                            <SelectItem value="3days">3 Days</SelectItem>
                                            <SelectItem value="7days">7 Days</SelectItem>
                                            <SelectItem value="30days">30 Days</SelectItem>
                                            <SelectItem value="permanent">Permanent</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div>
                                        <Label htmlFor="reason">Reason</Label>
                                        <Textarea
                                          id="reason"
                                          name="reason"
                                          placeholder="Reason for ban..."
                                          required
                                          className="mt-1"
                                        />
                                      </div>
                                    </div>
                                    <DialogFooter>
                                      <Button type="submit" variant="destructive">
                                        Confirm Ban
                                      </Button>
                                    </DialogFooter>
                                  </form>
                                </DialogContent>
                              </Dialog>

                              {/* Assign Role */}
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="outline" title="Assign Role">
                                    <Shield className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Assign Role</DialogTitle>
                                    <DialogDescription>
                                      Assign a role to @{user.handle}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <form onSubmit={(e) => {
                                    e.preventDefault();
                                    const formData = new FormData(e.currentTarget);
                                    const role = formData.get("role") as string;
                                    handleAssignRole(user.id, role);
                                  }}>
                                    <div className="space-y-4 py-4">
                                      <div>
                                        <Label htmlFor="role">Role</Label>
                                        <Select name="role" required>
                                          <SelectTrigger className="mt-1">
                                            <SelectValue placeholder="Select role" />
                                          </SelectTrigger>
                                           <SelectContent>
                                            {currentUserRole === 'owner' && (
                                              <>
                                                <SelectItem value="admin">Admin</SelectItem>
                                                <SelectItem value="moderator">Moderator</SelectItem>
                                                <SelectItem value="partner">Partner</SelectItem>
                                                <SelectItem value="verified">Verified</SelectItem>
                                                <SelectItem value="developer">Developer</SelectItem>
                                                <SelectItem value="early_supporter">Early Supporter</SelectItem>
                                                <SelectItem value="vip">VIP</SelectItem>
                                                <SelectItem value="content_mod">Content Moderator</SelectItem>
                                                <SelectItem value="junior_mod">Junior Moderator</SelectItem>
                                                <SelectItem value="support">Support</SelectItem>
                                              </>
                                            )}
                                            {currentUserRole === 'admin' && (
                                              <>
                                                <SelectItem value="moderator">Moderator</SelectItem>
                                                <SelectItem value="partner">Partner</SelectItem>
                                                <SelectItem value="verified">Verified</SelectItem>
                                                <SelectItem value="developer">Developer</SelectItem>
                                                <SelectItem value="early_supporter">Early Supporter</SelectItem>
                                                <SelectItem value="vip">VIP</SelectItem>
                                                <SelectItem value="content_mod">Content Moderator</SelectItem>
                                                <SelectItem value="junior_mod">Junior Moderator</SelectItem>
                                                <SelectItem value="support">Support</SelectItem>
                                              </>
                                            )}
                                            {currentUserRole === 'moderator' && (
                                              <>
                                                <SelectItem value="verified">Verified</SelectItem>
                                                <SelectItem value="junior_mod">Junior Moderator</SelectItem>
                                                <SelectItem value="support">Support</SelectItem>
                                              </>
                                            )}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <p className="text-sm text-muted-foreground mt-2">
                                        {currentUserRole === 'owner' ? 'As owner, you can assign any role' : 
                                         currentUserRole === 'admin' ? 'As admin, you can assign moderator roles' :
                                         'You can assign support roles'}
                                      </p>
                                    </div>
                                    <DialogFooter>
                                      <Button type="submit">
                                        Assign Role
                                      </Button>
                                    </DialogFooter>
                                   </form>
                                </DialogContent>
                              </Dialog>

                              {/* Delete User Account */}
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    size="sm" 
                                    variant="destructive" 
                                    disabled={!canModerateUser(user.roles)}
                                    title="Delete Account"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2 text-destructive">
                                      <AlertCircle className="w-5 h-5" />
                                      Permanently Delete User Account
                                    </DialogTitle>
                                    <DialogDescription>
                                      This action cannot be undone. This will permanently delete @{user.handle}'s account and all associated data including:
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 my-4">
                                    <ul className="text-sm space-y-1 text-muted-foreground">
                                      <li>• Profile and personal information</li>
                                      <li>• All projects and services</li>
                                      <li>• Messages and conversations</li>
                                      <li>• Follows and reactions</li>
                                      <li>• Warnings and moderation history</li>
                                    </ul>
                                  </div>
                                  <form onSubmit={(e) => {
                                    e.preventDefault();
                                    const formData = new FormData(e.currentTarget);
                                    const confirmation = formData.get("confirmation") as string;
                                    if (confirmation === user.handle) {
                                      handleDeleteUser(user.user_id, user.handle);
                                    } else {
                                      toast({
                                        title: "Error",
                                        description: "Username does not match. Please type the exact username to confirm.",
                                        variant: "destructive"
                                      });
                                    }
                                  }}>
                                    <div className="space-y-4 py-4">
                                      <div>
                                        <Label htmlFor="confirmation">
                                          Type <span className="font-mono font-bold">{user.handle}</span> to confirm
                                        </Label>
                                        <Input
                                          id="confirmation"
                                          name="confirmation"
                                          placeholder={user.handle}
                                          required
                                          className="mt-1"
                                        />
                                      </div>
                                    </div>
                                    <DialogFooter>
                                      <Button type="submit" variant="destructive">
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete Account Permanently
                                      </Button>
                                    </DialogFooter>
                                  </form>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>

            {/* Banned Users Tab */}
            <TabsContent value="bans">
              <div className="glass-card rounded-2xl p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold mb-4">Banned Users</h2>
                {bannedUsers.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No banned users</p>
                ) : (
                  <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Banned At</TableHead>
                          <TableHead>Expires</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bannedUsers.map((banned) => (
                          <TableRow key={banned.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{banned.display_name}</p>
                                <p className="text-sm text-muted-foreground">@{banned.handle}</p>
                              </div>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">{banned.reason}</TableCell>
                            <TableCell>{formatDistanceToNow(new Date(banned.banned_at), { addSuffix: true })}</TableCell>
                            <TableCell>
                              {banned.expires_at ? (
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4" />
                                  {formatDistanceToNow(new Date(banned.expires_at), { addSuffix: true })}
                                </div>
                              ) : (
                                <Badge variant="destructive">Permanent</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUnbanUser(banned.user_id)}
                              >
                                <UserCheck className="w-4 h-4 mr-2" />
                                Unban
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Warnings Tab */}
            <TabsContent value="warnings">
              <div className="glass-card rounded-2xl p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold mb-4">Recent Warnings</h2>
                {warnings.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No warnings issued</p>
                ) : (
                  <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Severity</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Issued</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {warnings.map((warning) => (
                          <TableRow key={warning.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{warning.display_name}</p>
                                <p className="text-sm text-muted-foreground">@{warning.handle}</p>
                              </div>
                            </TableCell>
                            <TableCell>{getSeverityBadge(warning.severity)}</TableCell>
                            <TableCell className="max-w-xs truncate">{warning.reason}</TableCell>
                            <TableCell>{formatDistanceToNow(new Date(warning.created_at), { addSuffix: true })}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Reports Tab */}
            <TabsContent value="reports">
              <div className="glass-card rounded-2xl p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold mb-4">User Reports</h2>
                {reports.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No reports submitted</p>
                ) : (
                  <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Target Type</TableHead>
                          <TableHead>Target ID</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Reported</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reports.map((report) => (
                          <TableRow key={report.id}>
                            <TableCell>
                              <Badge variant="secondary">{report.target_type}</Badge>
                            </TableCell>
                            <TableCell className="font-mono text-xs truncate max-w-[100px]">
                              {report.target_id.substring(0, 8)}...
                            </TableCell>
                            <TableCell className="max-w-xs">
                              <div className="truncate" title={report.reason}>
                                {report.reason}
                              </div>
                              {report.details && (
                                <p className="text-xs text-muted-foreground truncate mt-1" title={report.details}>
                                  {report.details}
                                </p>
                              )}
                            </TableCell>
                            <TableCell>
                              <Select
                                value={report.status}
                                onValueChange={(status) => updateReportStatus(report.id, status as "open" | "reviewing" | "resolved" | "dismissed")}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="open">Open</SelectItem>
                                  <SelectItem value="reviewing">Reviewing</SelectItem>
                                  <SelectItem value="resolved">Resolved</SelectItem>
                                  <SelectItem value="dismissed">Dismissed</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                {report.target_type === 'project' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      adminUnpublishProject(report.target_id);
                                      updateReportStatus(report.id, "resolved");
                                    }}
                                  >
                                    Unpublish
                                  </Button>
                                )}
                                {report.target_type === 'service' && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        adminDeactivateService(report.target_id);
                                        updateReportStatus(report.id, "resolved");
                                      }}
                                    >
                                      Deactivate
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => {
                                        if (confirm("Permanently delete this service? This cannot be undone!")) {
                                          adminDeleteService(report.target_id);
                                          updateReportStatus(report.id, "resolved");
                                        }
                                      }}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Feedback Tab */}
            <TabsContent value="feedback">
              <div className="glass-card rounded-2xl p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold mb-4">User Feedback</h2>
                {feedback.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No feedback submitted yet</p>
                ) : (
                  <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {feedback.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <Badge variant={item.type === 'bug' ? 'destructive' : 'default'}>
                                {item.type === 'bug' ? '🐛 Bug' : '💡 Suggestion'}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">{item.title}</TableCell>
                            <TableCell>@{item.handle}</TableCell>
                            <TableCell>
                              <Select
                                value={item.status}
                                onValueChange={(value) => updateFeedbackStatus(item.id, value)}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="open">Open</SelectItem>
                                  <SelectItem value="in_progress">In Progress</SelectItem>
                                  <SelectItem value="resolved">Resolved</SelectItem>
                                  <SelectItem value="dismissed">Dismissed</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button size="sm" variant="outline">View</Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-2xl">
                                    <DialogHeader>
                                      <DialogTitle className="flex items-center gap-2">
                                        {item.type === 'bug' ? '🐛' : '💡'} {item.title}
                                      </DialogTitle>
                                      <DialogDescription>
                                        Submitted by @{item.handle} • {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div>
                                        <h4 className="font-semibold mb-2">Description</h4>
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.description}</p>
                                      </div>
                                      {item.url && (
                                        <div>
                                          <h4 className="font-semibold mb-2">Related URL</h4>
                                          <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                                            {item.url}
                                          </a>
                                        </div>
                                      )}
                                      {item.screenshot_url && (
                                        <div>
                                          <h4 className="font-semibold mb-2">Screenshot</h4>
                                          <img src={item.screenshot_url} alt="Feedback screenshot" className="rounded-lg border max-w-full" />
                                        </div>
                                      )}
                                    </div>
                                  </DialogContent>
                                </Dialog>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    if (confirm("Delete this feedback permanently?")) {
                                      handleDeleteFeedback(item.id);
                                    }
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Announcements Tab */}
            <TabsContent value="announcements">
              <div className="glass-card rounded-2xl p-4 sm:p-6 mb-6">
                <h2 className="text-xl sm:text-2xl font-bold mb-4">Create Announcement</h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="announcement-title">Title</Label>
                    <Input
                      id="announcement-title"
                      value={announcementTitle}
                      onChange={(e) => setAnnouncementTitle(e.target.value)}
                      placeholder="Announcement title..."
                      maxLength={100}
                    />
                  </div>
                  <div>
                    <Label htmlFor="announcement-message">Message</Label>
                    <Textarea
                      id="announcement-message"
                      value={announcementMessage}
                      onChange={(e) => setAnnouncementMessage(e.target.value)}
                      placeholder="Announcement message..."
                      maxLength={500}
                      rows={4}
                    />
                  </div>
                  <Button onClick={createAnnouncement} className="w-full sm:w-auto">
                    <Megaphone className="w-4 h-4 mr-2" />
                    Send to All Users
                  </Button>
                </div>
              </div>

              <div className="glass-card rounded-2xl p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold mb-4">Past Announcements</h2>
                {announcements.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No announcements yet</p>
                ) : (
                  <div className="space-y-4">
                    {announcements.map((announcement) => (
                      <div
                        key={announcement.id}
                        className="border rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{announcement.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {formatDistanceToNow(new Date(announcement.created_at), {
                                addSuffix: true,
                              })}
                            </p>
                          </div>
                          {announcement.active ? (
                            <Badge variant="default">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Deactivated</Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground mb-4">{announcement.message}</p>
                        {announcement.active && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deactivateAnnouncement(announcement.id)}
                          >
                            Deactivate
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="reviews">
              <div className="glass-card rounded-2xl p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold mb-4">Service Reviews</h2>
                <p className="text-muted-foreground">Reviews management - view all reviews from ServiceDetail pages</p>
              </div>
            </TabsContent>

            {/* Comments Tab */}
            <TabsContent value="comments">
              <div className="glass-card rounded-2xl p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold mb-4">Project Comments</h2>
                <p className="text-muted-foreground">Comments management - view and moderate from Project pages</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Admin;