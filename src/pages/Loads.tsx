import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Filter, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import CreateLoadDialog from "@/components/loads/CreateLoadDialog";
import LoadDetailsDialog from "@/components/loads/LoadDetailsDialog";

const Loads = () => {
  const { toast } = useToast();
  const [loads, setLoads] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [brokers, setBrokers] = useState<any[]>([]);
  const [carriers, setCarriers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedLoadId, setSelectedLoadId] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string>("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("user_id", user.id)
        .single();

      if (!profile?.company_id) return;

      setCompanyId(profile.company_id);

      // Fetch all data in parallel
      const [loadsRes, driversRes, brokersRes, carriersRes] = await Promise.all([
        supabase
          .from("loads")
          .select("*, drivers(first_name, last_name), brokers(name), carriers(name)")
          .eq("company_id", profile.company_id)
          .order("created_at", { ascending: false }),
        supabase
          .from("drivers")
          .select("*")
          .eq("company_id", profile.company_id)
          .order("first_name"),
        supabase
          .from("brokers")
          .select("*")
          .eq("company_id", profile.company_id)
          .order("name"),
        supabase
          .from("carriers")
          .select("*")
          .eq("company_id", profile.company_id)
          .order("name"),
      ]);

      if (loadsRes.error) throw loadsRes.error;

      setLoads(loadsRes.data || []);
      setDrivers(driversRes.data || []);
      setBrokers(brokersRes.data || []);
      setCarriers(carriersRes.data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch data",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    const classes: Record<string, string> = {
      pending: "status-pending",
      assigned: "status-assigned",
      picked: "status-picked",
      in_transit: "status-in-transit",
      delivered: "status-delivered",
      cancelled: "bg-red-100 text-red-800 border-red-200",
    };
    return classes[status] || "status-pending";
  };

  const filteredLoads = loads.filter((load) => {
    const matchesSearch = 
      load.load_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      load.pickup_city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      load.delivery_city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      load.commodity?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || load.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleLoadClick = (loadId: string) => {
    setSelectedLoadId(loadId);
    setDetailsDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Loads</h1>
            <p className="text-muted-foreground">Manage and track all your shipments</p>
          </div>
          <Button className="gap-2" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4" />
            Create Load
          </Button>
        </div>

        {/* Search and Filters */}
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by load number, city, commodity..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="picked">Picked Up</SelectItem>
                  <SelectItem value="in_transit">In Transit</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              {(searchTerm || statusFilter !== "all") && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                  }}
                  title="Clear filters"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Loads List */}
        <div className="space-y-4">
          {loading ? (
            <Card className="glass-card">
              <CardContent className="py-8 text-center text-muted-foreground">
                Loading loads...
              </CardContent>
            </Card>
          ) : filteredLoads.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="py-12 text-center">
                <div className="max-w-md mx-auto space-y-4">
                  <div className="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center">
                    <Plus className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">No loads found</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm
                        ? "Try adjusting your search"
                        : "Get started by creating your first load"}
                    </p>
                    {!searchTerm && (
                      <Button onClick={() => setCreateDialogOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Load
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredLoads.map((load) => (
              <Card 
                key={load.id} 
                className="glass-card transition-smooth hover:shadow-lg cursor-pointer"
                onClick={() => handleLoadClick(load.id)}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">{load.load_number}</h3>
                        <span className={`status-badge ${getStatusBadgeClass(load.status)}`}>
                          {load.status.replace("_", " ")}
                        </span>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground mb-1">Pickup</p>
                          <p className="font-medium">
                            {load.pickup_city}, {load.pickup_state}
                          </p>
                          {load.pickup_date && (
                            <p className="text-xs text-muted-foreground">
                              {new Date(load.pickup_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">Delivery</p>
                          <p className="font-medium">
                            {load.delivery_city}, {load.delivery_state}
                          </p>
                          {load.delivery_date && (
                            <p className="text-xs text-muted-foreground">
                              {new Date(load.delivery_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm">
                        {load.drivers && (
                          <div>
                            <span className="text-muted-foreground">Driver: </span>
                            <span className="font-medium">
                              {load.drivers.first_name} {load.drivers.last_name}
                            </span>
                          </div>
                        )}
                        {load.brokers && (
                          <div>
                            <span className="text-muted-foreground">Broker: </span>
                            <span className="font-medium">{load.brokers.name}</span>
                          </div>
                        )}
                        {load.commodity && (
                          <div>
                            <span className="text-muted-foreground">Commodity: </span>
                            <span className="font-medium">{load.commodity}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right space-y-2">
                      {load.rate && (
                        <p className="text-2xl font-bold text-green-600">
                          ${load.rate.toLocaleString()}
                        </p>
                      )}
                      {load.distance && (
                        <p className="text-sm text-muted-foreground">{load.distance} miles</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Dialogs */}
      <CreateLoadDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={fetchData}
        drivers={drivers}
        brokers={brokers}
        carriers={carriers}
        companyId={companyId}
      />

      <LoadDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        loadId={selectedLoadId}
        onUpdate={fetchData}
      />
    </DashboardLayout>
  );
};

export default Loads;
