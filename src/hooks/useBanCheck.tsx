import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface BanInfo {
  isBanned: boolean;
  reason: string | null;
  expiresAt: string | null;
  loading: boolean;
}

export const useBanCheck = () => {
  const [banInfo, setBanInfo] = useState<BanInfo>({
    isBanned: false,
    reason: null,
    expiresAt: null,
    loading: true,
  });

  useEffect(() => {
    checkBanStatus();

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      checkBanStatus();
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const checkBanStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setBanInfo({ isBanned: false, reason: null, expiresAt: null, loading: false });
        return;
      }

      const { data: banData, error } = await supabase
        .from("banned_users")
        .select("reason, expires_at, unbanned_at")
        .eq("user_id", session.user.id)
        .is("unbanned_at", null)
        .order("banned_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (banData) {
        const isExpired = banData.expires_at && new Date(banData.expires_at) < new Date();
        
        setBanInfo({
          isBanned: !isExpired,
          reason: banData.reason,
          expiresAt: banData.expires_at,
          loading: false,
        });
      } else {
        setBanInfo({ isBanned: false, reason: null, expiresAt: null, loading: false });
      }
    } catch (error) {
      console.error("Error checking ban status:", error);
      setBanInfo({ isBanned: false, reason: null, expiresAt: null, loading: false });
    }
  };

  return banInfo;
};
