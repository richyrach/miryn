import { ReactNode, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useWarningCheck } from "@/hooks/useWarningCheck";

interface WarningGuardProps {
  children: ReactNode;
}

export const WarningGuard = ({ children }: WarningGuardProps) => {
  const { hasUnacknowledgedWarning, loading } = useWarningCheck();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (hasUnacknowledgedWarning && location.pathname !== "/warning") {
      navigate("/warning", { replace: true });
    }
  }, [hasUnacknowledgedWarning, location.pathname, navigate]);

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
