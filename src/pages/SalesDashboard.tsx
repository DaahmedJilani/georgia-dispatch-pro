import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TruckIcon, DollarSign, Percent, User, UserPlus, Building } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface SalesStats {
  carriersOnboarded: number;
  driversOnboarded: number;
  myCommission: number;
  conversionRate: number;
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
    carriersOnboarded: 0,
    driversOnboarded: 0,
    myCommission: 0,
    conversionRate: 0,
  });
  const [myLoads, setMyLoads] = useState<Load[]>([]);

  useEffect(() => {
    fetchSalesData();
  }, []);

  const fetchSalesData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch carriers onboarded by this sales agent
      const { data: carriersData } = await supabase
        .from('carriers')
        .select('id')
        .eq('sales_agent_id', user.id);

      // Fetch drivers onboarded by this sales agent
      const { data: driversData } = await supabase
        .from('drivers')
        .select('id, status')
        .eq('sales_agent_id', user.id);

      // Fetch loads where this sales agent is assigned
      const { data: loadsData } = await supabase
        .from('loads')
        .select('*')
        .eq('sales_user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      const carriersCount = carriersData?.length || 0;
      const driversCount = driversData?.length || 0;
      const activeDrivers = driversData?.filter(d => d.status === 'available' || d.status === 'active').length || 0;

      // Calculate conversion rate
      const conversionRate = carriersCount > 0 ? ((activeDrivers / carriersCount) * 100) : 0;

      // Calculate total commission from loads
      const totalCommission = loadsData?.reduce((sum, load) => {
        const rate = Number(load.rate || 0);
        const percentage = Number(load.sales_percentage || 0);
        return sum + (rate * percentage / 100);
      }, 0) || 0;

      setStats({
        carriersOnboarded: carriersCount,
        driversOnboarded: driversCount,
        myCommission: totalCommission,
        conversionRate: Math.round(conversionRate),
      });

      if (loadsData) {
        setMyLoads(loadsData);
      }
    } catch (error) {
      console.error('Error fetching sales data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { 
      title: 'Carriers Onboarded', 
      value: stats.carriersOnboarded, 
      icon: TruckIcon, 
      gradient: 'from-purple-500 to-purple-600',
      description: 'Total carriers I brought in'
    },
    { 
      title: 'Drivers Onboarded', 
      value: stats.driversOnboarded, 
      icon: User, 
      gradient: 'from-blue-500 to-blue-600',
      description: 'Total drivers I brought in'
    },
    { 
      title: 'Conversion Rate', 
      value: `${stats.conversionRate}%`, 
      icon: Percent, 
      gradient: 'from-green-500 to-green-600',
      description: 'Carriers → Active Drivers'
    },
    { 
      title: 'My Commission', 
      value: `$${stats.myCommission.toLocaleString()}`, 
      icon: DollarSign, 
      gradient: 'from-orange-500 to-orange-600',
      description: 'Total earnings'
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
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
              Sales Dashboard
            </h1>
            <p className="text-muted-foreground">Track your onboarding performance and commissions</p>
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
