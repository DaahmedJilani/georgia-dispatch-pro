import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Users, UserCheck, Target, TrendingUp } from 'lucide-react';

interface SalesMetrics {
  followUps: number;
  promises: number;
  closed: number;
  activated: number;
}

interface ChartData {
  name: string;
  value: number;
}

export function SalesAnalytics({ salesAgentId }: { salesAgentId: string }) {
  const [metrics, setMetrics] = useState<SalesMetrics>({
    followUps: 0,
    promises: 0,
    closed: 0,
    activated: 0,
  });
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSalesMetrics();
  }, [salesAgentId]);

  const fetchSalesMetrics = async () => {
    try {
      // Fetch sales activities
      const { data: activities } = await supabase
        .from('sales_activities')
        .select('*')
        .eq('sales_agent_id', salesAgentId);

      const followUps = activities?.filter(a => a.activity_type === 'follow_up').length || 0;
      const promises = activities?.filter(a => a.activity_type === 'promise').length || 0;
      const closed = activities?.filter(a => a.activity_type === 'closed').length || 0;
      const activated = activities?.filter(a => a.activity_type === 'activated').length || 0;

      setMetrics({ followUps, promises, closed, activated });
      setChartData([
        { name: 'Follow-ups', value: followUps },
        { name: 'Promises', value: promises },
        { name: 'Closed', value: closed },
        { name: 'Activated', value: activated },
      ]);
    } catch (error) {
      console.error('Error fetching sales metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const conversionRate = metrics.promises > 0 ? Math.round((metrics.closed / metrics.promises) * 100) : 0;
  const activationRate = metrics.closed > 0 ? Math.round((metrics.activated / metrics.closed) * 100) : 0;

  if (loading) {
    return <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-blue-500 to-blue-600" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Follow-ups</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.followUps}</div>
            <p className="text-xs text-muted-foreground">Total contacts made</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-yellow-500 to-yellow-600" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promises</CardTitle>
            <Target className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.promises}</div>
            <p className="text-xs text-muted-foreground">Verbal commitments</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-green-500 to-green-600" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Closed</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.closed}</div>
            <p className="text-xs text-muted-foreground">Contracts signed</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-purple-500 to-purple-600" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activated</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activated}</div>
            <p className="text-xs text-muted-foreground">First load completed</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sales Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--role-sales))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conversion Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Promise → Closed</span>
                <span className="text-sm font-bold">{conversionRate}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all"
                  style={{ width: `${conversionRate}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Closed → Activated</span>
                <span className="text-sm font-bold">{activationRate}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all"
                  style={{ width: `${activationRate}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
