import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { formatDate, formatCurrency, getStatusBadgeVariant, getDaysUntilDue } from '@/lib/subscription-utils';
import { AlertCircle, CheckCircle, Clock, Ban, Mail } from 'lucide-react';
import { HolographicCard } from '@/components/3d/HolographicCard';

interface CompanySubscription {
  id: string;
  name: string;
  subscription_payment_status: string;
  subscription_due_date: string;
  last_payment_date: string | null;
  subscription_amount: number;
}

export default function SubscriptionManagement() {
  const [companies, setCompanies] = useState<CompanySubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ paid: 0, pending: 0, overdue: 0, suspended: 0 });
  const { toast } = useToast();

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, subscription_payment_status, subscription_due_date, last_payment_date, subscription_amount')
        .order('name');

      if (error) throw error;

      setCompanies(data || []);

      // Calculate stats
      const statsData = {
        paid: data?.filter(c => c.subscription_payment_status === 'paid').length || 0,
        pending: data?.filter(c => c.subscription_payment_status === 'pending').length || 0,
        overdue: data?.filter(c => c.subscription_payment_status === 'overdue').length || 0,
        suspended: data?.filter(c => c.subscription_payment_status === 'suspended').length || 0,
      };
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching companies:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch companies',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleMarkAsPaid = async (companyId: string, amount: number) => {
    try {
      // Update company status
      const { error: updateError } = await supabase
        .from('companies')
        .update({
          subscription_payment_status: 'paid',
          last_payment_date: new Date().toISOString().split('T')[0],
          payment_reminder_sent: false,
        })
        .eq('id', companyId);

      if (updateError) throw updateError;

      // Record payment
      const { error: paymentError } = await supabase
        .from('subscription_payments')
        .insert({
          company_id: companyId,
          amount,
          payment_date: new Date().toISOString().split('T')[0],
          status: 'completed',
        });

      if (paymentError) throw paymentError;

      toast({
        title: 'Success',
        description: 'Payment recorded successfully',
      });

      fetchCompanies();
    } catch (error) {
      console.error('Error marking as paid:', error);
      toast({
        title: 'Error',
        description: 'Failed to record payment',
        variant: 'destructive',
      });
    }
  };

  const handleSuspend = async (companyId: string) => {
    try {
      const { error } = await supabase
        .from('companies')
        .update({
          subscription_payment_status: 'suspended',
          suspension_date: new Date().toISOString(),
        })
        .eq('id', companyId);

      if (error) throw error;

      toast({
        title: 'Company Suspended',
        description: 'All users from this company can no longer login',
      });

      fetchCompanies();
    } catch (error) {
      console.error('Error suspending company:', error);
      toast({
        title: 'Error',
        description: 'Failed to suspend company',
        variant: 'destructive',
      });
    }
  };

  const handleResume = async (companyId: string) => {
    try {
      const { error } = await supabase
        .from('companies')
        .update({
          subscription_payment_status: 'pending',
          suspension_date: null,
        })
        .eq('id', companyId);

      if (error) throw error;

      toast({
        title: 'Company Resumed',
        description: 'Users can now login again',
      });

      fetchCompanies();
    } catch (error) {
      console.error('Error resuming company:', error);
      toast({
        title: 'Error',
        description: 'Failed to resume company',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Subscription Management</h1>
            <p className="text-muted-foreground">Manage company subscriptions and payments</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <HolographicCard>
            <Card className="border-0 bg-transparent">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Paid</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.paid}</div>
              </CardContent>
            </Card>
          </HolographicCard>

          <HolographicCard>
            <Card className="border-0 bg-transparent">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pending}</div>
              </CardContent>
            </Card>
          </HolographicCard>

          <HolographicCard>
            <Card className="border-0 bg-transparent">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                <AlertCircle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.overdue}</div>
              </CardContent>
            </Card>
          </HolographicCard>

          <HolographicCard>
            <Card className="border-0 bg-transparent">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Suspended</CardTitle>
                <Ban className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.suspended}</div>
              </CardContent>
            </Card>
          </HolographicCard>
        </div>

        {/* Companies Table */}
        <HolographicCard>
          <Card className="border-0 bg-transparent">
            <CardHeader>
              <CardTitle>Companies</CardTitle>
              <CardDescription>Manage subscription status for all companies</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Days Remaining</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Last Payment</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((company) => {
                    const daysUntilDue = getDaysUntilDue(company.subscription_due_date);
                    return (
                      <TableRow key={company.id}>
                        <TableCell className="font-medium">{company.name}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(company.subscription_payment_status)}>
                            {company.subscription_payment_status}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(company.subscription_due_date)}</TableCell>
                        <TableCell>
                          <span className={daysUntilDue < 0 ? 'text-red-500 font-semibold' : ''}>
                            {daysUntilDue < 0 ? `${Math.abs(daysUntilDue)} days overdue` : `${daysUntilDue} days`}
                          </span>
                        </TableCell>
                        <TableCell>{formatCurrency(company.subscription_amount)}</TableCell>
                        <TableCell>
                          {company.last_payment_date ? formatDate(company.last_payment_date) : 'Never'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {company.subscription_payment_status !== 'paid' && (
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleMarkAsPaid(company.id, company.subscription_amount)}
                              >
                                Mark Paid
                              </Button>
                            )}
                            {company.subscription_payment_status === 'suspended' ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleResume(company.id)}
                              >
                                Resume
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleSuspend(company.id)}
                              >
                                Suspend
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </HolographicCard>
      </div>
    </DashboardLayout>
  );
}
