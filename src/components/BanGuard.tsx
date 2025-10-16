import { ReactNode, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useBanCheck } from "@/hooks/useBanCheck";
import Banned from "@/pages/Banned";
import { supabase } from "@/integrations/supabase/client";

interface BanGuardProps {
  children: ReactNode;
}

export const BanGuard = ({ children }: BanGuardProps) => {
  const { isBanned, reason, expiresAt, loading, recheckBanStatus } = useBanCheck();
  const location = useLocation();
  const navigate = useNavigate();
  const [wasUnbanned, setWasUnbanned] = useState(false);

  // Listen for realtime changes to ban status
  useEffect(() => {
    let channel: any;

    const setupRealtime = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      channel = supabase
        .channel('ban-status-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'banned_users',
            filter: `user_id=eq.${session.user.id}`
          },
          () => {
            recheckBanStatus();
          }
        )
        .subscribe();
    };

    setupRealtime();

    // Also check every 10 seconds for ban expiration
    const interval = setInterval(() => {
      recheckBanStatus();
    }, 10000);

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
      clearInterval(interval);
    };
  }, [recheckBanStatus]);

  // Redirect to home when unbanned
  useEffect(() => {
    if (!loading && !isBanned && location.pathname === "/banned" && !wasUnbanned) {
      setWasUnbanned(true);
      navigate("/", { replace: true });
    }
  }, [isBanned, loading, location.pathname, navigate, wasUnbanned]);

  // Redirect to banned page when banned
  useEffect(() => {
    if (isBanned && location.pathname !== "/banned") {
      setWasUnbanned(false);
      navigate("/banned", { replace: true });
    }
  }, [isBanned, location.pathname, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (isBanned) {
    return <Banned reason={reason} expiresAt={expiresAt} />;
  }

  return <>{children}</>;
};
