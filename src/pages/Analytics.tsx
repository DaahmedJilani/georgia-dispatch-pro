import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { BarChart3, TrendingUp, DollarSign, Truck, Users, Package } from "lucide-react";

const Analytics = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>({
    totalRevenue: 0,
    totalLoads: 0,
    completedLoads: 0,
    activeDrivers: 0,
    activeBrokers: 0,
    avgRevenuePerLoad: 0,
    topDrivers: [],
    topBrokers: [],
    revenueByStatus: {},
    loadsByMonth: [],
  });

  useEffect(() => {
    checkAuth();
    fetchAnalytics();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchAnalytics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("user_id", user.id)
        .single();

      if (!profile?.company_id) return;

      // Fetch all loads for the company
      const { data: loads } = await supabase
        .from("loads")
        .select(`
          *,
          drivers(id, first_name, last_name),
          brokers(id, name, company_name)
        `)
        .eq("company_id", profile.company_id);

      if (!loads) return;

      // Calculate analytics
      const totalRevenue = loads.reduce((sum, load) => sum + (Number(load.rate) || 0), 0);
      const completedLoads = loads.filter(l => l.status === 'delivered').length;
      
      // Top performing drivers
      const driverStats = loads.reduce((acc: any, load) => {
        if (load.driver_id && load.drivers) {
          const key = load.driver_id;
          if (!acc[key]) {
            acc[key] = {
              id: load.driver_id,
              name: `${load.drivers.first_name} ${load.drivers.last_name}`,
              loads: 0,
              revenue: 0,
            };
          }
          acc[key].loads += 1;
          acc[key].revenue += Number(load.rate) || 0;
        }
        return acc;
      }, {});

      const topDrivers = Object.values(driverStats)
        .sort((a: any, b: any) => b.revenue - a.revenue)
        .slice(0, 5);

      // Top performing brokers
      const brokerStats = loads.reduce((acc: any, load) => {
        if (load.broker_id && load.brokers) {
          const key = load.broker_id;
          if (!acc[key]) {
            acc[key] = {
              id: load.broker_id,
              name: load.brokers.name,
              company: load.brokers.company_name,
              loads: 0,
              revenue: 0,
            };
          }
          acc[key].loads += 1;
          acc[key].revenue += Number(load.rate) || 0;
        }
        return acc;
      }, {});

      const topBrokers = Object.values(brokerStats)
        .sort((a: any, b: any) => b.revenue - a.revenue)
        .slice(0, 5);

      // Revenue by status
      const revenueByStatus = loads.reduce((acc: any, load) => {
        const status = load.status || 'unknown';
        if (!acc[status]) acc[status] = 0;
        acc[status] += Number(load.rate) || 0;
        return acc;
      }, {});

      // Count unique active drivers and brokers
      const activeDrivers = new Set(loads.map(l => l.driver_id).filter(Boolean)).size;
      const activeBrokers = new Set(loads.map(l => l.broker_id).filter(Boolean)).size;

      setAnalytics({
        totalRevenue,
        totalLoads: loads.length,
        completedLoads,
        activeDrivers,
        activeBrokers,
        avgRevenuePerLoad: loads.length > 0 ? totalRevenue / loads.length : 0,
        topDrivers,
        topBrokers,
        revenueByStatus,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-3xl font-bold mt-2">{String(value)}</p>
        </div>
        <div className={`p-4 rounded-full ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </Card>
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p>Loading analytics...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Business intelligence and performance metrics</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            icon={DollarSign}
            label="Total Revenue"
            value={`$${analytics.totalRevenue.toFixed(2)}`}
            color="bg-green-500"
          />
          <StatCard
            icon={Package}
            label="Total Loads"
            value={analytics.totalLoads.toString()}
            color="bg-blue-500"
          />
          <StatCard
            icon={Package}
            label="Completed Loads"
            value={analytics.completedLoads.toString()}
            color="bg-purple-500"
          />
          <StatCard
            icon={Truck}
            label="Active Drivers"
            value={analytics.activeDrivers.toString()}
            color="bg-orange-500"
          />
          <StatCard
            icon={Users}
            label="Active Brokers"
            value={analytics.activeBrokers.toString()}
            color="bg-indigo-500"
          />
          <StatCard
            icon={BarChart3}
            label="Avg Revenue/Load"
            value={`$${analytics.avgRevenuePerLoad.toFixed(2)}`}
            color="bg-cyan-500"
          />
        </div>

        {/* Revenue by Status */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Revenue by Load Status</h3>
          <div className="space-y-3">
            {Object.entries(analytics.revenueByStatus).map(([status, revenue]: [string, any]) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    status === 'delivered' ? 'bg-green-500' :
                    status === 'in_transit' ? 'bg-blue-500' :
                    status === 'picked' ? 'bg-yellow-500' :
                    status === 'assigned' ? 'bg-purple-500' :
                    'bg-gray-500'
                  }`} />
                  <span className="capitalize">{status.replace('_', ' ')}</span>
                </div>
                <span className="font-semibold">
                  ${(revenue as number).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Performers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Drivers */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Top Performing Drivers
            </h3>
            {analytics.topDrivers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No driver data available</p>
            ) : (
              <div className="space-y-3">
                {analytics.topDrivers.map((driver: any, index: number) => (
                  <div key={driver.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                      <div>
                        <p className="font-medium">{driver.name}</p>
                        <p className="text-sm text-muted-foreground">{driver.loads} loads</p>
                      </div>
                    </div>
                    <p className="font-semibold text-green-600">
                      ${driver.revenue.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Top Brokers */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Top Performing Brokers
            </h3>
            {analytics.topBrokers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No broker data available</p>
            ) : (
              <div className="space-y-3">
                {analytics.topBrokers.map((broker: any, index: number) => (
                  <div key={broker.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                      <div>
                        <p className="font-medium">{broker.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {broker.company || 'No company'} • {broker.loads} loads
                        </p>
                      </div>
                    </div>
                    <p className="font-semibold text-green-600">
                      ${broker.revenue.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
