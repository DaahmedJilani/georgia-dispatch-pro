import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Package, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Analytics = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    completedLoads: 0,
    activeDrivers: 0,
    avgLoadRate: 0,
  });
  const [loading, setLoading] = useState(true);

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
      const { data: loads } = await supabase
        .from("loads")
        .select("rate, status");

      const { data: drivers } = await supabase
        .from("drivers")
        .select("status");

      const completedLoads = loads?.filter(l => l.status === "delivered") || [];
      const totalRevenue = completedLoads.reduce((sum, l) => sum + (Number(l.rate) || 0), 0);
      const avgRate = completedLoads.length > 0 ? totalRevenue / completedLoads.length : 0;
      const activeDrivers = drivers?.filter(d => d.status === "on_route").length || 0;

      setStats({
        totalRevenue,
        completedLoads: completedLoads.length,
        activeDrivers,
        avgLoadRate: avgRate,
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

  const statCards = [
    {
      title: "Total Revenue",
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      title: "Completed Loads",
      value: stats.completedLoads,
      icon: Package,
      color: "text-blue-600",
    },
    {
      title: "Active Drivers",
      value: stats.activeDrivers,
      icon: Users,
      color: "text-purple-600",
    },
    {
      title: "Avg Load Rate",
      value: `$${stats.avgLoadRate.toFixed(0)}`,
      icon: TrendingUp,
      color: "text-orange-600",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Business performance insights</p>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading analytics...</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {statCards.map((stat) => (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
