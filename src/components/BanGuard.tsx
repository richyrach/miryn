import { ReactNode, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useBanCheck } from "@/hooks/useBanCheck";
import Banned from "@/pages/Banned";

interface BanGuardProps {
  children: ReactNode;
}

export const BanGuard = ({ children }: BanGuardProps) => {
  const { isBanned, reason, expiresAt, loading } = useBanCheck();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (isBanned && location.pathname !== "/banned") {
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
