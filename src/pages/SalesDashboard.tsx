import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TruckIcon, DollarSign, Percent, User, UserPlus, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SalesAnalytics } from '@/components/analytics/SalesAnalytics';
import { SalesWorkflowTracker } from '@/components/sales/SalesWorkflowTracker';

interface SalesStats {
  carriersOnboarded: number;
  driversOnboarded: number;
  conversionRate: number;
}

export default function SalesDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SalesStats>({
    carriersOnboarded: 0,
    driversOnboarded: 0,
    conversionRate: 0,
  });
  const [salesAgentId, setSalesAgentId] = useState<string>('');

  useEffect(() => {
    fetchSalesData();
  }, []);

  const fetchSalesData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setSalesAgentId(user.id);

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

      const carriersCount = carriersData?.length || 0;
      const driversCount = driversData?.length || 0;
      const activeDrivers = driversData?.filter(d => d.status === 'available' || d.status === 'active').length || 0;

      // Calculate conversion rate
      const conversionRate = carriersCount > 0 ? ((activeDrivers / carriersCount) * 100) : 0;

      setStats({
        carriersOnboarded: carriersCount,
        driversOnboarded: driversCount,
        conversionRate: Math.round(conversionRate),
      });
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
            <h1 className="text-3xl font-bold" style={{ background: 'var(--gradient-sales)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Sales Dashboard
            </h1>
            <p className="text-muted-foreground">Track your onboarding performance and commissions</p>
            <Badge className="mt-2" style={{ background: 'hsl(var(--role-sales))', color: 'hsl(var(--role-sales-foreground))' }}>
              Sales Agent
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Upload Sales Docs
            </Button>
            <Button style={{ background: 'hsl(var(--role-sales))' }}>
              <UserPlus className="mr-2 h-4 w-4" />
              Invite Carrier
            </Button>
          </div>
        </div>

        <SalesAnalytics salesAgentId={salesAgentId} />

        <div className="grid gap-4 md:grid-cols-3">
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

        <SalesWorkflowTracker />
      </div>
    </DashboardLayout>
  );
}
