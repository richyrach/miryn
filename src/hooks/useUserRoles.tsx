import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

type AppRole = 
  | 'owner'
  | 'admin'
  | 'moderator'
  | 'content_mod'
  | 'junior_mod'
  | 'support'
  | 'partner'
  | 'verified'
  | 'developer'
  | 'vip'
  | 'early_supporter'
  | 'user';

export const useUserRoles = (userId: string | undefined) => {
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setRoles([]);
      setLoading(false);
      return;
    }

    fetchUserRoles();
  }, [userId]);

  const fetchUserRoles = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) {
        console.error("Error fetching user roles:", error);
        setRoles([]);
      } else if (data && data.length > 0) {
        // Get all roles except 'user'
        const userRoles = data
          .map(r => r.role as AppRole)
          .filter(r => r !== 'user');
        setRoles(userRoles);
      } else {
        setRoles([]);
      }
    } catch (error) {
      console.error("Error in user roles fetch:", error);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  return { roles, loading };
};
