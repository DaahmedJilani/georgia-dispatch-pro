import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TruckIcon, DollarSign, Percent, FileText } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface SalesStats {
  myLoads: number;
  myCommission: number;
  pendingContracts: number;
  totalRevenue: number;
}

interface Load {
  id: string;
  load_number: string;
  pickup_city: string;
  pickup_state: string;
  delivery_city: string;
  delivery_state: string;
  rate: number;
  status: string;
  sales_percentage: number;
}

export default function SalesDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SalesStats>({
    myLoads: 0,
    myCommission: 0,
    pendingContracts: 0,
    totalRevenue: 0,
  });
  const [myLoads, setMyLoads] = useState<Load[]>([]);

  useEffect(() => {
    fetchSalesData();
  }, []);

  const fetchSalesData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch loads where this user is the sales agent
      const { data: loadsData } = await supabase
        .from('loads')
        .select('*')
        .eq('sales_user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (loadsData) {
        const totalRevenue = loadsData.reduce((sum, load) => sum + Number(load.rate || 0), 0);
        const totalCommission = loadsData.reduce((sum, load) => {
          const rate = Number(load.rate || 0);
          const percentage = Number(load.sales_percentage || 0);
          return sum + (rate * percentage / 100);
        }, 0);
        const pendingContracts = loadsData.filter(l => !l.contract_signed).length;

        setStats({
          myLoads: loadsData.length,
          myCommission: totalCommission,
          pendingContracts,
          totalRevenue,
        });
        setMyLoads(loadsData);
      }
    } catch (error) {
      console.error('Error fetching sales data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: 'My Loads', value: stats.myLoads, icon: TruckIcon, color: 'text-blue-600' },
    { title: 'My Commission', value: `$${stats.myCommission.toLocaleString()}`, icon: DollarSign, color: 'text-green-600' },
    { title: 'Pending Contracts', value: stats.pendingContracts, icon: FileText, color: 'text-orange-600' },
    { title: 'Revenue Generated', value: `$${stats.totalRevenue.toLocaleString()}`, icon: Percent, color: 'text-purple-600' },
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
        <div>
          <h1 className="text-3xl font-bold">Sales Dashboard</h1>
          <p className="text-muted-foreground">Track your sales performance and commissions</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>My Active Loads</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Load #</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Commission %</TableHead>
                  <TableHead>My Commission</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myLoads.map((load) => (
                  <TableRow key={load.id}>
                    <TableCell className="font-medium">{load.load_number}</TableCell>
                    <TableCell>
                      {load.pickup_city}, {load.pickup_state} → {load.delivery_city}, {load.delivery_state}
                    </TableCell>
                    <TableCell>${Number(load.rate).toLocaleString()}</TableCell>
                    <TableCell>{load.sales_percentage}%</TableCell>
                    <TableCell className="font-semibold text-green-600">
                      ${((Number(load.rate) * Number(load.sales_percentage || 0)) / 100).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={load.status === 'delivered' ? 'default' : 'secondary'}>
                        {load.status}
                      </Badge>
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
