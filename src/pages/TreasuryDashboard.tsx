import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface TreasuryStats {
  totalInvoices: number;
  outstanding: number;
  paidThisMonth: number;
  factoringActive: number;
}

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  amount: number;
  status: string;
  payment_date: string | null;
  brokers?: {
    name: string;
  };
}

export default function TreasuryDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<TreasuryStats>({
    totalInvoices: 0,
    outstanding: 0,
    paidThisMonth: 0,
    factoringActive: 0,
  });
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    fetchTreasuryData();
  }, []);

  const fetchTreasuryData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.company_id) return;

      const [invoicesResult, loadsResult] = await Promise.all([
        supabase
          .from('invoices')
          .select(`
            *,
            brokers(name)
          `)
          .eq('company_id', profile.company_id)
          .order('invoice_date', { ascending: false })
          .limit(20),
        supabase
          .from('loads')
          .select('id', { count: 'exact' })
          .eq('company_id', profile.company_id)
          .eq('factoring', true)
      ]);

      if (invoicesResult.data) {
        const outstanding = invoicesResult.data
          .filter(inv => inv.status === 'pending' || inv.status === 'sent')
          .reduce((sum, inv) => sum + Number(inv.amount), 0);

        const thisMonth = new Date();
        thisMonth.setDate(1);
        const paidThisMonth = invoicesResult.data
          .filter(inv => inv.status === 'paid' && inv.payment_date && new Date(inv.payment_date) >= thisMonth)
          .reduce((sum, inv) => sum + Number(inv.amount), 0);

        setStats({
          totalInvoices: invoicesResult.data.length,
          outstanding,
          paidThisMonth,
          factoringActive: loadsResult.count || 0,
        });
        setInvoices(invoicesResult.data);
      }
    } catch (error) {
      console.error('Error fetching treasury data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { 
      title: 'Total Pending', 
      value: stats.totalInvoices, 
      icon: FileText, 
      gradient: 'from-orange-500 to-orange-600',
      description: 'Invoices awaiting payment'
    },
    { 
      title: 'Outstanding Balance', 
      value: `$${stats.outstanding.toLocaleString()}`, 
      icon: AlertCircle, 
      gradient: 'from-red-500 to-red-600',
      description: 'Total unpaid amount'
    },
    { 
      title: 'Paid This Month', 
      value: `$${stats.paidThisMonth.toLocaleString()}`, 
      icon: CheckCircle, 
      gradient: 'from-green-500 to-green-600',
      description: 'Successfully collected'
    },
    { 
      title: 'Factoring Active', 
      value: stats.factoringActive, 
      icon: DollarSign, 
      gradient: 'from-blue-500 to-blue-600',
      description: 'Loads using factoring'
    },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent">
              Treasury Dashboard
            </h1>
            <p className="text-muted-foreground">Monitor invoices, payments, and financial health</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Card key={stat.title} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <div className={`h-2 bg-gradient-to-r ${stat.gradient}`} />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`p-2 rounded-lg bg-gradient-to-r ${stat.gradient} bg-opacity-10`}>
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Broker</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                    <TableCell>{invoice.brokers?.name || 'N/A'}</TableCell>
                    <TableCell>{new Date(invoice.invoice_date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-semibold">${Number(invoice.amount).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {invoice.payment_date ? new Date(invoice.payment_date).toLocaleDateString() : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
