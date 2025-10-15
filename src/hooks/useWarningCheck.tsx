import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface WarningInfo {
  hasUnacknowledgedWarning: boolean;
  warnings: Array<{
    id: string;
    reason: string;
    severity: string;
    created_at: string;
  }>;
  loading: boolean;
}

export const useWarningCheck = () => {
  const [warningInfo, setWarningInfo] = useState<WarningInfo>({
    hasUnacknowledgedWarning: false,
    warnings: [],
    loading: true,
  });

  useEffect(() => {
    checkWarningStatus();

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      checkWarningStatus();
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const checkWarningStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setWarningInfo({ hasUnacknowledgedWarning: false, warnings: [], loading: false });
        return;
      }

      // Get all unacknowledged warnings for the user
      const { data: warnings, error } = await supabase
        .from("user_warnings")
        .select("id, reason, severity, created_at")
        .eq("user_id", session.user.id)
        .is("acknowledged_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setWarningInfo({
        hasUnacknowledgedWarning: (warnings?.length || 0) > 0,
        warnings: warnings || [],
        loading: false,
      });
    } catch (error) {
      console.error("Error checking warning status:", error);
      setWarningInfo({ hasUnacknowledgedWarning: false, warnings: [], loading: false });
    }
  };

  const acknowledgeWarning = async (warningId: string) => {
    try {
      const { error } = await supabase
        .from("user_warnings")
        .update({ acknowledged_at: new Date().toISOString() } as any)
        .eq("id", warningId);

      if (error) throw error;

      // Refresh warning status
      await checkWarningStatus();
      return { success: true };
    } catch (error) {
      console.error("Error acknowledging warning:", error);
      return { success: false, error };
    }
  };

  return { ...warningInfo, acknowledgeWarning };
};
