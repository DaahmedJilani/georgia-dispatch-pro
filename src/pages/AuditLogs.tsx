import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, Search, Filter, FileText, Truck, Users, Package, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const AuditLogs = () => {
  const { toast } = useToast();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");

  useEffect(() => {
    fetchAuditLogs();
  }, [entityFilter, actionFilter]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("audit_logs")
        .select(`
          *,
          profiles:user_id(first_name, last_name)
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (entityFilter !== "all") {
        query = query.eq("entity_type", entityFilter);
      }

      if (actionFilter !== "all") {
        query = query.eq("action", actionFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs(data || []);
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

  const getEntityIcon = (entityType: string) => {
    const icons: Record<string, any> = {
      loads: Package,
      invoices: DollarSign,
      documents: FileText,
      drivers: Truck,
      brokers: Users,
    };
    const Icon = icons[entityType] || FileText;
    return <Icon className="w-4 h-4" />;
  };

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      created: "bg-green-500",
      updated: "bg-blue-500",
      deleted: "bg-red-500",
    };
    return colors[action] || "bg-gray-500";
  };

  const filteredLogs = logs.filter((log) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      log.entity_type.toLowerCase().includes(searchLower) ||
      log.action.toLowerCase().includes(searchLower) ||
      log.profiles?.first_name?.toLowerCase().includes(searchLower) ||
      log.profiles?.last_name?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="w-8 h-8" />
            Audit Logs
          </h1>
          <p className="text-muted-foreground">
            Track all system changes and maintain compliance
          </p>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Entity Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entities</SelectItem>
                  <SelectItem value="loads">Loads</SelectItem>
                  <SelectItem value="invoices">Invoices</SelectItem>
                  <SelectItem value="documents">Documents</SelectItem>
                  <SelectItem value="drivers">Drivers</SelectItem>
                  <SelectItem value="brokers">Brokers</SelectItem>
                </SelectContent>
              </Select>

              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Action Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="created">Created</SelectItem>
                  <SelectItem value="updated">Updated</SelectItem>
                  <SelectItem value="deleted">Deleted</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Showing {filteredLogs.length} of {logs.length} logs
              </p>
              <Button variant="outline" size="sm" onClick={fetchAuditLogs}>
                <Filter className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <ScrollArea className="h-[600px]">
            <CardContent className="pt-6">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading audit logs...
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No audit logs found
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredLogs.map((log) => (
                    <Card key={log.id} className="p-4 hover:shadow-md transition-smooth">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="p-2 rounded-lg bg-muted">
                            {getEntityIcon(log.entity_type)}
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge className={getActionColor(log.action)}>
                                {log.action.toUpperCase()}
                              </Badge>
                              <span className="font-semibold capitalize">
                                {log.entity_type}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {log.profiles ? (
                                <>
                                  by{" "}
                                  <span className="font-medium">
                                    {log.profiles.first_name} {log.profiles.last_name}
                                  </span>
                                </>
                              ) : (
                                "by System"
                              )}
                              {" • "}
                              {format(new Date(log.created_at), "MMM d, yyyy 'at' h:mm a")}
                            </p>
                            {log.changes?.changed_fields && (
                              <div className="text-xs text-muted-foreground mt-2">
                                <p className="font-medium">Changes:</p>
                                <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto">
                                  {JSON.stringify(log.changes.changed_fields, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </ScrollArea>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AuditLogs;
