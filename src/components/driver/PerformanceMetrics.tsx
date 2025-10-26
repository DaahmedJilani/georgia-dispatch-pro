import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Clock, DollarSign, Target, Calendar } from "lucide-react";

interface PerformanceMetricsProps {
  totalLoads: number;
  onTimeDeliveries: number;
  totalEarnings: number;
  averageDeliveryTime: number; // in hours
  loadsThisMonth: number;
}

export const PerformanceMetrics = ({
  totalLoads,
  onTimeDeliveries,
  totalEarnings,
  averageDeliveryTime,
  loadsThisMonth,
}: PerformanceMetricsProps) => {
  const onTimePercentage = totalLoads > 0 
    ? Math.round((onTimeDeliveries / totalLoads) * 100) 
    : 0;

  const metrics = [
    {
      title: "On-Time Delivery",
      value: `${onTimePercentage}%`,
      subtitle: `${onTimeDeliveries} of ${totalLoads} loads`,
      icon: Target,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Avg Delivery Time",
      value: `${averageDeliveryTime}h`,
      subtitle: "Per load completion",
      icon: Clock,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Total Earnings",
      value: `$${totalEarnings.toLocaleString()}`,
      subtitle: "All time earnings",
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
    {
      title: "This Month",
      value: loadsThisMonth.toString(),
      subtitle: "Loads completed",
      icon: Calendar,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="w-6 h-6" />
          Performance Dashboard
        </h2>
        <p className="text-muted-foreground">Track your delivery performance and earnings</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.title} className="glass-card transition-smooth hover:shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {metric.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                  <Icon className={`w-4 h-4 ${metric.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metric.subtitle}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
