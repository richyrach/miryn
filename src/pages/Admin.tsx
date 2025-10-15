import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Shield, UserX, UserCheck, Trash2 } from "lucide-react";
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

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [bannedUsers, setBannedUsers] = useState<any[]>([]);

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
    setLoading(false);
  };

  const fetchUsers = async () => {
    const { data } = await supabase
      .from("public_profiles")
      .select("*")
      .order("created_at", { ascending: false });
    
    setUsers(data || []);
  };

  const fetchBannedUsers = async () => {
    const { data } = await supabase
      .from("banned_users")
      .select("*")
      .order("banned_at", { ascending: false });
    
    setBannedUsers(data || []);
  };

  const handleBanUser = async (userId: string, reason: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    
    const { error } = await supabase
      .from("banned_users")
      .insert({
        user_id: userId,
        banned_by: session?.user.id,
        reason
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to ban user.",
        variant: "destructive"
      });
    } else {
      toast({ title: "User banned successfully" });
      fetchUsers();
      fetchBannedUsers();
    }
  };

  const handleUnbanUser = async (userId: string) => {
    const { error } = await supabase
      .from("banned_users")
      .delete()
      .eq("user_id", userId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to unban user.",
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
    
    const { error } = await supabase
      .from("user_roles")
      .insert([{
        user_id: userId,
        role: role as 'owner' | 'admin' | 'moderator' | 'user',
        created_by: session?.user.id
      }]);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to assign role. User may already have this role.",
        variant: "destructive"
      });
    } else {
      toast({ title: `Role '${role}' assigned successfully` });
      fetchUsers();
    }
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

          {/* Users Table */}
          <div className="glass-card rounded-2xl p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4">All Users</h2>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Handle</TableHead>
                    <TableHead>Display Name</TableHead>
                    <TableHead>Role</TableHead>
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
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="destructive">
                                <UserX className="w-4 h-4" />
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
                                handleBanUser(user.id, reason);
                              }}>
                                <div className="space-y-4 py-4">
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

          {/* Banned Users */}
          {bannedUsers.length > 0 && (
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-2xl font-bold mb-4">Banned Users</h2>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User ID</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Banned At</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bannedUsers.map((banned) => (
                      <TableRow key={banned.id}>
                        <TableCell className="font-mono text-xs">{banned.user_id}</TableCell>
                        <TableCell>{banned.reason}</TableCell>
                        <TableCell>{new Date(banned.banned_at).toLocaleDateString()}</TableCell>
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
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Admin;
