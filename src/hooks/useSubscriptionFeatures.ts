import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { SubscriptionFeatures } from '@/lib/subscription-features';

export function useSubscriptionFeatures() {
  const [features, setFeatures] = useState<SubscriptionFeatures>({
    driver_portal: false,
    messages: false,
    fleet_map: false,
    invoices: false,
  });
  const [loading, setLoading] = useState(true);
  const [tier, setTier] = useState<'basic' | 'pro' | null>(null);

  useEffect(() => {
    const fetchFeatures = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        // Get user's profile to find company
        const { data: profile } = await supabase
          .from('profiles')
          .select('company_id, is_master_admin')
          .eq('user_id', user.id)
          .single();

        // Master admins have all features
        if (profile?.is_master_admin) {
          setFeatures({
            driver_portal: true,
            messages: true,
            fleet_map: true,
            invoices: true,
          });
          setTier('pro');
          setLoading(false);
          return;
        }

        if (!profile?.company_id) {
          setLoading(false);
          return;
        }

        // Fetch company subscription features
        const { data: company } = await supabase
          .from('companies')
          .select('subscription_tier, subscription_features')
          .eq('id', profile.company_id)
          .single();

        if (company) {
          setTier(company.subscription_tier as 'basic' | 'pro');
          setFeatures(company.subscription_features as SubscriptionFeatures);
        }
      } catch (error) {
        console.error('Error fetching subscription features:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatures();
  }, []);

  return { features, loading, tier };
}
