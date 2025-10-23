import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Truck, Users, DollarSign, TrendingUp, Clock } from "lucide-react";
import { WIPPanel } from "@/components/wip/WIPPanel";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalLoads: 0,
    activeLoads: 0,
    totalDrivers: 0,
    totalBrokers: 0,
  });
  const [recentLoads, setRecentLoads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's company
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("user_id", user.id)
        .single();

      if (!profile?.company_id) return;

      // Fetch stats
      const [loadsResult, activeLoadsResult, driversResult, brokersResult, recentLoadsResult] =
        await Promise.all([
          supabase
            .from("loads")
            .select("id", { count: "exact", head: true })
            .eq("company_id", profile.company_id),
          supabase
            .from("loads")
            .select("id", { count: "exact", head: true })
            .eq("company_id", profile.company_id)
            .in("status", ["assigned", "picked", "in_transit"]),
          supabase
            .from("drivers")
            .select("id", { count: "exact", head: true })
            .eq("company_id", profile.company_id),
          supabase
            .from("brokers")
            .select("id", { count: "exact", head: true })
            .eq("company_id", profile.company_id),
          supabase
            .from("loads")
            .select("*, drivers(first_name, last_name), brokers(name)")
            .eq("company_id", profile.company_id)
            .order("created_at", { ascending: false })
            .limit(5),
        ]);

      setStats({
        totalLoads: loadsResult.count || 0,
        activeLoads: activeLoadsResult.count || 0,
        totalDrivers: driversResult.count || 0,
        totalBrokers: brokersResult.count || 0,
      });

      setRecentLoads(recentLoadsResult.data || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Loads",
      value: stats.totalLoads,
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Active Loads",
      value: stats.activeLoads,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Drivers",
      value: stats.totalDrivers,
      icon: Truck,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Brokers",
      value: stats.totalBrokers,
      icon: Users,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ];

  const getStatusBadgeClass = (status: string) => {
    const classes: Record<string, string> = {
      pending: "status-pending",
      assigned: "status-assigned",
      picked: "status-picked",
      in_transit: "status-in-transit",
      delivered: "status-delivered",
    };
    return classes[status] || "status-pending";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your dispatch overview.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="glass-card transition-smooth hover:shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* WIP Panel */}
        <WIPPanel />

        {/* Recent Loads */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Recent Loads
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : recentLoads.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No loads yet. Create your first load to get started.
              </div>
            ) : (
              <div className="space-y-4">
                {recentLoads.map((load) => (
                  <div
                    key={load.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg transition-smooth hover:shadow-md"
                  >
                    <div className="space-y-1">
                      <p className="font-semibold">{load.load_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {load.pickup_city}, {load.pickup_state} → {load.delivery_city},{" "}
                        {load.delivery_state}
                      </p>
                      {load.drivers && (
                        <p className="text-xs text-muted-foreground">
                          Driver: {load.drivers.first_name} {load.drivers.last_name}
                        </p>
                      )}
                    </div>
                    <div className="text-right space-y-2">
                      <span className={`status-badge ${getStatusBadgeClass(load.status)}`}>
                        {load.status.replace("_", " ")}
                      </span>
                      {load.rate && (
                        <p className="text-sm font-semibold text-green-600">
                          ${load.rate.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
