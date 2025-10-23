import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const AnalyticsExport = ({ analytics }: { analytics: any }) => {
  const { toast } = useToast();

  const exportToCSV = () => {
    try {
      const csvData = [
        ["Metric", "Value"],
        ["Total Revenue", `$${analytics.totalRevenue.toFixed(2)}`],
        ["Total Loads", analytics.totalLoads],
        ["Completed Loads", analytics.completedLoads],
        ["Active Drivers", analytics.activeDrivers],
        ["Active Brokers", analytics.activeBrokers],
        ["Avg Revenue/Load", `$${analytics.avgRevenuePerLoad.toFixed(2)}`],
        [""],
        ["Top Drivers"],
        ["Rank", "Name", "Loads", "Revenue"],
        ...analytics.topDrivers.map((d: any, i: number) => [
          i + 1,
          d.name,
          d.loads,
          `$${d.revenue.toFixed(2)}`,
        ]),
        [""],
        ["Top Brokers"],
        ["Rank", "Name", "Company", "Loads", "Revenue"],
        ...analytics.topBrokers.map((b: any, i: number) => [
          i + 1,
          b.name,
          b.company || "N/A",
          b.loads,
          `$${b.revenue.toFixed(2)}`,
        ]),
      ];

      const csv = csvData.map((row) => row.join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `analytics-${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: "Analytics data exported to CSV",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export analytics data",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex gap-2">
      <Button onClick={exportToCSV} variant="outline" size="sm">
        <FileSpreadsheet className="w-4 h-4 mr-2" />
        Export CSV
      </Button>
    </div>
  );
};
