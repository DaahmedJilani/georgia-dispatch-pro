import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Truck, FileText, CheckCircle, XCircle, User } from "lucide-react";
import { DocumentUploadDialog } from "@/components/documents/DocumentUploadDialog";

interface CarrierInfo {
  id: string;
  name: string;
  mc_number: string | null;
  dot_number: string | null;
  email: string | null;
  phone: string | null;
  contract_signed: boolean;
  insurance_expiry: string | null;
  docusign_envelope_id: string | null;
}

interface Driver {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  status: string;
  license_number: string | null;
}

interface Load {
  id: string;
  load_number: string;
  pickup_location: string;
  delivery_location: string;
  status: string;
  rate: number;
  pickup_date: string | null;
  delivery_date: string | null;
}

export default function CarrierPortal() {
  const [loading, setLoading] = useState(true);
  const [carrier, setCarrier] = useState<CarrierInfo | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loads, setLoads] = useState<Load[]>([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      await fetchCarrierData(user.id);
    } catch (error) {
      console.error("Auth check error:", error);
      navigate("/auth");
    }
  };

  const fetchCarrierData = async (userId: string) => {
    try {
      // Get driver record to find carrier
      const { data: driverData, error: driverError } = await supabase
        .from("drivers")
        .select("carrier_id")
        .eq("user_id", userId)
        .single();

      if (driverError || !driverData?.carrier_id) {
        toast({
          title: "Error",
          description: "No carrier association found for this user",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Fetch carrier info
      const { data: carrierData, error: carrierError } = await supabase
        .from("carriers")
        .select("*")
        .eq("id", driverData.carrier_id)
        .single();

      if (carrierError) throw carrierError;
      setCarrier(carrierData);

      // Fetch all drivers for this carrier
      const { data: driversData, error: driversError } = await supabase
        .from("drivers")
        .select("*")
        .eq("carrier_id", driverData.carrier_id);

      if (driversError) throw driversError;
      setDrivers(driversData || []);

      // Fetch loads for this carrier's drivers
      const driverIds = driversData?.map((d) => d.id) || [];
      if (driverIds.length > 0) {
        const { data: loadsData, error: loadsError } = await supabase
          .from("loads")
          .select("*")
          .in("driver_id", driverIds)
          .order("created_at", { ascending: false });

        if (loadsError) throw loadsError;
        setLoads(loadsData || []);
      }
    } catch (error) {
      console.error("Error fetching carrier data:", error);
      toast({
        title: "Error",
        description: "Failed to load carrier information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors: { [key: string]: string } = {
      pending: "bg-yellow-500/10",
      assigned: "bg-blue-500/10",
      in_transit: "bg-purple-500/10",
      delivered: "bg-green-500/10",
      cancelled: "bg-red-500/10",
    };

    return (
      <Badge variant="outline" className={statusColors[status] || ""}>
        {status.replace("_", " ").toUpperCase()}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!carrier) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">No carrier information found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Carrier Portal</h1>
          <p className="text-muted-foreground">Manage your carrier account and drivers</p>
        </div>

        {/* Carrier Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  {carrier.name}
                </CardTitle>
                <CardDescription>Carrier Information</CardDescription>
              </div>
              <div className="flex gap-2">
                {carrier.contract_signed ? (
                  <Badge variant="outline" className="bg-green-500/10">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Contract Signed
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-500/10">
                    <XCircle className="w-3 h-3 mr-1" />
                    Contract Pending
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">MC Number</p>
                <p className="font-medium">{carrier.mc_number || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">DOT Number</p>
                <p className="font-medium">{carrier.dot_number || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{carrier.email || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{carrier.phone || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Insurance Expiry</p>
                <p className="font-medium">
                  {carrier.insurance_expiry
                    ? new Date(carrier.insurance_expiry).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </div>

            <Button onClick={() => setUploadDialogOpen(true)} className="w-full">
              <Upload className="w-4 h-4 mr-2" />
              Upload Documents
            </Button>
          </CardContent>
        </Card>

        {/* Drivers List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Drivers ({drivers.length})
            </CardTitle>
            <CardDescription>All drivers associated with this carrier</CardDescription>
          </CardHeader>
          <CardContent>
            {drivers.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No drivers found</p>
            ) : (
              <div className="space-y-3">
                {drivers.map((driver) => (
                  <div key={driver.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {driver.first_name} {driver.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">{driver.email || "No email"}</p>
                        <p className="text-sm text-muted-foreground">{driver.phone || "No phone"}</p>
                        {driver.license_number && (
                          <p className="text-xs text-muted-foreground mt-1">
                            License: {driver.license_number}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline">{driver.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Loads */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Assigned Loads ({loads.length})
            </CardTitle>
            <CardDescription>Loads assigned to your drivers</CardDescription>
          </CardHeader>
          <CardContent>
            {loads.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No loads found</p>
            ) : (
              <div className="space-y-3">
                {loads.map((load) => (
                  <div key={load.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium">{load.load_number}</p>
                        <p className="text-sm text-muted-foreground">
                          {load.pickup_location} → {load.delivery_location}
                        </p>
                      </div>
                      {getStatusBadge(load.status)}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Pickup:</span>{" "}
                        {load.pickup_date
                          ? new Date(load.pickup_date).toLocaleDateString()
                          : "TBD"}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Delivery:</span>{" "}
                        {load.delivery_date
                          ? new Date(load.delivery_date).toLocaleDateString()
                          : "TBD"}
                      </div>
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Rate:</span> ${load.rate?.toFixed(2) || "0.00"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <DocumentUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        carrierId={carrier.id}
      />
    </div>
  );
}
