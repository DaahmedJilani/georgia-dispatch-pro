import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionStatus {
  status: 'paid' | 'pending' | 'overdue' | 'suspended' | null;
  dueDate: string | null;
  amount: number | null;
  lastPayment: string | null;
  loading: boolean;
}

export function useSubscriptionStatus() {
  const [subscription, setSubscription] = useState<SubscriptionStatus>({
    status: null,
    dueDate: null,
    amount: null,
    lastPayment: null,
    loading: true,
  });

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setSubscription(prev => ({ ...prev, loading: false }));
          return;
        }

        // Get user's company
        const { data: profile } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('user_id', user.id)
          .single();

        if (!profile?.company_id) {
          setSubscription(prev => ({ ...prev, loading: false }));
          return;
        }

        // Get company subscription status
        const { data: company } = await supabase
          .from('companies')
          .select('subscription_payment_status, subscription_due_date, subscription_amount, last_payment_date')
          .eq('id', profile.company_id)
          .single();

        if (company) {
          setSubscription({
            status: company.subscription_payment_status as any,
            dueDate: company.subscription_due_date,
            amount: company.subscription_amount,
            lastPayment: company.last_payment_date,
            loading: false,
          });
        }
      } catch (error) {
        console.error('Error fetching subscription status:', error);
        setSubscription(prev => ({ ...prev, loading: false }));
      }
    };

    fetchSubscriptionStatus();
  }, []);

  return subscription;
}
