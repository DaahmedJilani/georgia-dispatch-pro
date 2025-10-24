import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UserRoleData {
  role: string | null;
  isMasterAdmin: boolean;
  companyId: string | null;
  loading: boolean;
}

export function useUserRole(): UserRoleData {
  const [role, setRole] = useState<string | null>(null);
  const [isMasterAdmin, setIsMasterAdmin] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setLoading(false);
          return;
        }

        // Fetch profile to get master admin status and company_id
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_master_admin, company_id')
          .eq('user_id', user.id)
          .single();

        if (profile) {
          setIsMasterAdmin(profile.is_master_admin || false);
          setCompanyId(profile.company_id);
        }

        // Fetch user role
        const { data: userRole } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (userRole) {
          setRole(userRole.role);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, []);

  return { role, isMasterAdmin, companyId, loading };
}
