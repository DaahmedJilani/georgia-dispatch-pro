import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TruckIcon, Building2, TrendingUp, DollarSign } from 'lucide-react';

interface DispatchMetrics {
  monthlyLoads: number;
  carriersManaged: number;
  newActivations: number;
  totalRevenue: number;
}

interface MonthlyData {
  month: string;
  loads: number;
  revenue: number;
}

export function DispatchAnalytics({ dispatcherId }: { dispatcherId: string }) {
  const [metrics, setMetrics] = useState<DispatchMetrics>({
    monthlyLoads: 0,
    carriersManaged: 0,
    newActivations: 0,
    totalRevenue: 0,
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDispatchMetrics();
  }, [dispatcherId]);

  const fetchDispatchMetrics = async () => {
    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      // Fetch dispatch performance records
      const { data: performance } = await supabase
        .from('dispatch_performance')
        .select('*')
        .eq('dispatcher_id', dispatcherId);

      const thisMonth = performance?.filter(
        p => new Date(p.created_at) >= startOfMonth
      ) || [];

      const uniqueCarriers = new Set(thisMonth.map(p => p.carrier_id)).size;
      const totalRevenue = thisMonth.reduce((sum, p) => sum + Number(p.revenue || 0), 0);

      // Calculate new activations (carriers with their first load this month)
      const carrierFirstLoads = new Map();
      performance?.forEach(p => {
        if (!carrierFirstLoads.has(p.carrier_id) || 
            new Date(p.created_at) < new Date(carrierFirstLoads.get(p.carrier_id))) {
          carrierFirstLoads.set(p.carrier_id, p.created_at);
        }
      });

      const newActivations = Array.from(carrierFirstLoads.values()).filter(
        date => new Date(date) >= startOfMonth
      ).length;

      setMetrics({
        monthlyLoads: thisMonth.length,
        carriersManaged: uniqueCarriers,
        newActivations,
        totalRevenue,
      });

      // Generate monthly chart data (last 6 months)
      const monthlyStats: MonthlyData[] = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date();
        monthDate.setMonth(monthDate.getMonth() - i);
        monthDate.setDate(1);
        const monthStart = new Date(monthDate);
        const monthEnd = new Date(monthDate);
        monthEnd.setMonth(monthEnd.getMonth() + 1);

        const monthPerf = performance?.filter(
          p => new Date(p.created_at) >= monthStart && new Date(p.created_at) < monthEnd
        ) || [];

        monthlyStats.push({
          month: monthDate.toLocaleDateString('en-US', { month: 'short' }),
          loads: monthPerf.length,
          revenue: monthPerf.reduce((sum, p) => sum + Number(p.revenue || 0), 0),
        });
      }

      setMonthlyData(monthlyStats);
    } catch (error) {
      console.error('Error fetching dispatch metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-orange-500 to-orange-600" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Loads</CardTitle>
            <TruckIcon className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.monthlyLoads}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-blue-500 to-blue-600" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Carriers Managed</CardTitle>
            <Building2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.carriersManaged}</div>
            <p className="text-xs text-muted-foreground">Active this month</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-green-500 to-green-600" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Activations</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.newActivations}</div>
            <p className="text-xs text-muted-foreground">First-time carriers</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-purple-500 to-purple-600" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Generated</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Loads Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="loads" stroke="hsl(var(--role-dispatch))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="hsl(var(--role-dispatch))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
