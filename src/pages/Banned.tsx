import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface BannedProps {
  reason?: string | null;
  expiresAt?: string | null;
}

const Banned = ({ reason, expiresAt }: BannedProps) => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const formatExpiry = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-destructive/5 via-background to-background">
      <div className="max-w-md w-full">
        <div className="glass-card rounded-2xl p-8 text-center border-2 border-destructive/20">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-destructive" />
          </div>
          
          <h1 className="text-3xl font-bold mb-4 text-destructive">Account Suspended</h1>
          
          <div className="bg-destructive/5 rounded-lg p-4 mb-6 border border-destructive/20">
            <p className="text-sm font-medium mb-2">Your account has been suspended from Miryn</p>
            
            {reason && (
              <div className="mt-3 pt-3 border-t border-destructive/20">
                <p className="text-xs text-muted-foreground mb-1 font-medium">Reason:</p>
                <p className="text-sm">{reason}</p>
              </div>
            )}
            
            {expiresAt && (
              <div className="mt-3 pt-3 border-t border-destructive/20">
                <p className="text-xs text-muted-foreground mb-1 font-medium">Ban expires:</p>
                <p className="text-sm font-medium">{formatExpiry(expiresAt)}</p>
              </div>
            )}
            
            {!expiresAt && (
              <div className="mt-3 pt-3 border-t border-destructive/20">
                <p className="text-xs text-destructive font-medium">This is a permanent ban</p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              During this suspension:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• You cannot access any part of Miryn</li>
              <li>• All your projects have been unpublished</li>
              <li>• Your profile is hidden from other users</li>
            </ul>
          </div>

          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground mb-4">
              If you believe this is a mistake, please contact support
            </p>
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="w-full"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Banned;
