import { ReactNode, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useWarningCheck } from "@/hooks/useWarningCheck";
import { supabase } from "@/integrations/supabase/client";

interface WarningGuardProps {
  children: ReactNode;
}

export const WarningGuard = ({ children }: WarningGuardProps) => {
  const { hasUnacknowledgedWarning, loading, recheckWarningStatus } = useWarningCheck();
  const location = useLocation();
  const navigate = useNavigate();
  const [isAcknowledging, setIsAcknowledging] = useState(false);

  // Listen for realtime changes to warning status
  useEffect(() => {
    let channel: any;

    const setupRealtime = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      channel = supabase
        .channel('warning-status-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_warnings',
            filter: `user_id=eq.${session.user.id}`
          },
          () => {
            recheckWarningStatus();
          }
        )
        .subscribe();
    };

    setupRealtime();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [recheckWarningStatus]);

  // Redirect to warning page if user has unacknowledged warnings
  useEffect(() => {
    if (!loading && hasUnacknowledgedWarning && location.pathname !== "/warning" && !isAcknowledging) {
      navigate("/warning", { replace: true });
    }
  }, [hasUnacknowledgedWarning, location.pathname, navigate, loading, isAcknowledging]);

  // Redirect to home after all warnings acknowledged
  useEffect(() => {
    if (!loading && !hasUnacknowledgedWarning && location.pathname === "/warning") {
      setIsAcknowledging(false);
      navigate("/", { replace: true });
    }
  }, [hasUnacknowledgedWarning, location.pathname, navigate, loading]);

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

  return <>{children}</>;
};
