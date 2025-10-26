import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Download, Database } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export const AnalyticsExport = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    loads: true,
    drivers: true,
    brokers: true,
    carriers: true,
    invoices: true,
    documents: true,
    messages: true,
    auditLogs: false,
  });

  const exportData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("user_id", user.id)
        .single();

      if (!profile?.company_id) throw new Error("Company not found");

      const exportData: any = {
        exportedAt: new Date().toISOString(),
        companyId: profile.company_id,
      };

      // Fetch selected data
      if (exportOptions.loads) {
        const { data } = await supabase
          .from("loads")
          .select("*")
          .eq("company_id", profile.company_id);
        exportData.loads = data;
      }

      if (exportOptions.drivers) {
        const { data } = await supabase
          .from("drivers")
          .select("*")
          .eq("company_id", profile.company_id);
        exportData.drivers = data;
      }

      if (exportOptions.brokers) {
        const { data } = await supabase
          .from("brokers")
          .select("*")
          .eq("company_id", profile.company_id);
        exportData.brokers = data;
      }

      if (exportOptions.carriers) {
        const { data } = await supabase
          .from("carriers")
          .select("*")
          .eq("company_id", profile.company_id);
        exportData.carriers = data;
      }

      if (exportOptions.invoices) {
        const { data } = await supabase
          .from("invoices")
          .select("*")
          .eq("company_id", profile.company_id);
        exportData.invoices = data;
      }

      if (exportOptions.documents) {
        const { data } = await supabase
          .from("documents")
          .select("*")
          .eq("company_id", profile.company_id);
        exportData.documents = data;
      }

      if (exportOptions.messages) {
        const { data } = await supabase
          .from("messages")
          .select("*")
          .eq("company_id", profile.company_id);
        exportData.messages = data;
      }

      if (exportOptions.auditLogs) {
        const { data } = await supabase
          .from("audit_logs")
          .select("*")
          .eq("company_id", profile.company_id);
        exportData.auditLogs = data;
      }

      // Download as JSON
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `data-export-${new Date().toISOString()}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: "Your data has been exported successfully",
      });
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Data Export (GDPR Compliance)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Export all your company data in JSON format. This includes all records associated with your account.
        </p>

        <div className="space-y-3">
          {Object.entries(exportOptions).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <Label htmlFor={key} className="capitalize">
                {key.replace(/([A-Z])/g, " $1").trim()}
              </Label>
              <Switch
                id={key}
                checked={value}
                onCheckedChange={(checked) =>
                  setExportOptions({ ...exportOptions, [key]: checked })
                }
              />
            </div>
          ))}
        </div>

        <Button onClick={exportData} disabled={loading} className="w-full">
          <Download className="mr-2 h-4 w-4" />
          {loading ? "Exporting..." : "Export Data"}
        </Button>
      </CardContent>
    </Card>
  );
};
