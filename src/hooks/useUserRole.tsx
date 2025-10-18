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

const ROLE_HIERARCHY: AppRole[] = [
  'owner',
  'admin',
  'moderator',
  'content_mod',
  'junior_mod',
  'support',
  'partner',
  'verified',
  'developer',
  'vip',
  'early_supporter',
  'user'
];

export const useUserRole = (userId: string | undefined) => {
  const [role, setRole] = useState<AppRole>('user');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setRole('user');
      setLoading(false);
      return;
    }

    fetchUserRole();
  }, [userId]);

  const fetchUserRole = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) {
        console.error("Error fetching user role:", error);
        setRole('user');
      } else if (data && data.length > 0) {
        // Get the highest priority role
        const userRoles = data.map(r => r.role as AppRole);
        const highestRole = ROLE_HIERARCHY.find(r => userRoles.includes(r)) || 'user';
        setRole(highestRole);
      } else {
        setRole('user');
      }
    } catch (error) {
      console.error("Error in user role fetch:", error);
      setRole('user');
    } finally {
      setLoading(false);
    }
  };

  return { role, loading };
};
