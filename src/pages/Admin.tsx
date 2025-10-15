import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Shield, UserX, UserCheck, AlertTriangle, Ban, Clock } from "lucide-react";
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
  role: string;
  warning_count: number;
}

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserWithWarnings[]>([]);
  const [bannedUsers, setBannedUsers] = useState<any[]>([]);
  const [warnings, setWarnings] = useState<any[]>([]);

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

    setIsAdmin(true);
    fetchUsers();
    fetchBannedUsers();
    fetchWarnings();
    setLoading(false);
  };

  const fetchUsers = async () => {
    const { data } = await supabase
      .from("public_profiles")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (data) {
      // Get warning counts for each user
      const usersWithWarnings = await Promise.all(
        data.map(async (user) => {
          // Get user_id from profiles table
          const { data: profile } = await supabase
            .from("profiles")
            .select("user_id")
            .eq("id", user.id)
            .single();

          if (!profile) {
            return { ...user, warning_count: 0 };
          }

          const { data: warningData } = await supabase
            .from("user_warnings")
            .select("id")
            .eq("user_id", profile.user_id);

          return {
            ...user,
            warning_count: warningData?.length || 0
          };
        })
      );

      setUsers(usersWithWarnings);
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
      .from("user_roles")
      .insert([{
        user_id: profile.user_id,
        role: role as 'owner' | 'admin' | 'moderator' | 'user',
        created_by: session?.user.id
      }]);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to assign role",
        variant: "destructive"
      });
    } else {
      toast({ title: `Role '${role}' assigned successfully` });
      fetchUsers();
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
            <TabsList className="grid w-full grid-cols-3 max-w-md">
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="bans">Banned Users</TabsTrigger>
              <TabsTrigger value="warnings">Warnings</TabsTrigger>
            </TabsList>

            {/* Users Tab */}
            <TabsContent value="users">
              <div className="glass-card rounded-2xl p-6">
                <h2 className="text-2xl font-bold mb-4">All Users</h2>
                <div className="overflow-x-auto">
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
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>@{user.handle}</TableCell>
                          <TableCell>{user.display_name}</TableCell>
                          <TableCell>
                            <span className={user.role !== 'user' ? 'text-primary font-semibold' : ''}>
                              {user.role}
                            </span>
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
                                  <Button size="sm" variant="outline">
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
                                  <Button size="sm" variant="destructive">
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
                                  <Button size="sm" variant="outline">
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
                                            <SelectItem value="moderator">Moderator</SelectItem>
                                            <SelectItem value="admin">Admin</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>
                                    <DialogFooter>
                                      <Button type="submit">
                                        Assign Role
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
              <div className="glass-card rounded-2xl p-6">
                <h2 className="text-2xl font-bold mb-4">Banned Users</h2>
                {bannedUsers.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No banned users</p>
                ) : (
                  <div className="overflow-x-auto">
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
              <div className="glass-card rounded-2xl p-6">
                <h2 className="text-2xl font-bold mb-4">Recent Warnings</h2>
                {warnings.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No warnings issued</p>
                ) : (
                  <div className="overflow-x-auto">
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
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Admin;