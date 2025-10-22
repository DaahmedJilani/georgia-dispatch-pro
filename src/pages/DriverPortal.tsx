import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Navigation, Upload, Clock } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DriverPortal = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loads, setLoads] = useState<any[]>([]);
  const [driverId, setDriverId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [trackingLocation, setTrackingLocation] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchDriverLoads();
    startLocationTracking();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchDriverLoads = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get driver ID from user
      const { data: driver } = await supabase
        .from("drivers")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!driver) {
        toast({
          title: "Access Denied",
          description: "You need to be assigned as a driver to access this portal",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setDriverId(driver.id);

      const { data, error } = await supabase
        .from("loads")
        .select(`
          *,
          brokers(name, company_name, phone),
          drivers(first_name, last_name)
        `)
        .eq("driver_id", driver.id)
        .in("status", ["assigned", "picked", "in_transit"])
        .order("pickup_date", { ascending: true });

      if (error) throw error;
      setLoads(data || []);
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

  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      console.log("Geolocation not supported");
      return;
    }

    setTrackingLocation(true);

    // Update location every 5 minutes
    const interval = setInterval(() => {
      updateDriverLocation();
    }, 300000);

    // Initial update
    updateDriverLocation();

    return () => clearInterval(interval);
  };

  const updateDriverLocation = () => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        if (!driverId) return;

        const { error } = await supabase
          .from("drivers")
          .update({
            current_location_lat: position.coords.latitude,
            current_location_lng: position.coords.longitude,
            last_location_update: new Date().toISOString(),
          })
          .eq("id", driverId);

        if (error) {
          console.error("Failed to update location:", error);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
      }
    );
  };

  const updateLoadStatus = async (loadId: string, newStatus: 'assigned' | 'picked' | 'in_transit' | 'delivered') => {
    try {
      const { error } = await supabase
        .from("loads")
        .update({ status: newStatus })
        .eq("id", loadId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Load status updated successfully",
      });

      fetchDriverLoads();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      assigned: "bg-blue-500",
      picked: "bg-yellow-500",
      in_transit: "bg-purple-500",
    };

    return (
      <Badge className={colors[status] || "bg-gray-500"}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getNextStatusOptions = (currentStatus: string): Array<'assigned' | 'picked' | 'in_transit' | 'delivered'> => {
    const statusFlow: Record<string, Array<'assigned' | 'picked' | 'in_transit' | 'delivered'>> = {
      assigned: ["picked"],
      picked: ["in_transit"],
      in_transit: ["delivered"],
    };

    return statusFlow[currentStatus] || [];
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Driver Portal</h1>
            <p className="text-muted-foreground">Manage your assigned loads</p>
          </div>
          {trackingLocation && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <Navigation className="w-4 h-4 animate-pulse" />
              <span>Location tracking active</span>
            </div>
          )}
        </div>

        {loading ? (
          <Card className="p-8">
            <p className="text-center text-muted-foreground">Loading your loads...</p>
          </Card>
        ) : loads.length === 0 ? (
          <Card className="p-8">
            <p className="text-center text-muted-foreground">No active loads assigned to you</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {loads.map((load) => (
              <Card key={load.id} className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-semibold">{load.load_number}</h3>
                      <p className="text-sm text-muted-foreground">{load.commodity || 'General Freight'}</p>
                    </div>
                    {getStatusBadge(load.status)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-blue-500 mt-1" />
                        <div>
                          <p className="font-medium">Pickup</p>
                          <p className="text-sm text-muted-foreground">{load.pickup_location}</p>
                          <p className="text-sm text-muted-foreground">
                            {load.pickup_city}, {load.pickup_state}
                          </p>
                          {load.pickup_date && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <Clock className="w-3 h-3" />
                              {new Date(load.pickup_date).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-green-500 mt-1" />
                        <div>
                          <p className="font-medium">Delivery</p>
                          <p className="text-sm text-muted-foreground">{load.delivery_location}</p>
                          <p className="text-sm text-muted-foreground">
                            {load.delivery_city}, {load.delivery_state}
                          </p>
                          {load.delivery_date && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <Clock className="w-3 h-3" />
                              {new Date(load.delivery_date).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {load.brokers && (
                    <div className="pt-2 border-t">
                      <p className="text-sm">
                        <span className="font-medium">Broker Contact:</span> {load.brokers.name}
                        {load.brokers.phone && <span> - {load.brokers.phone}</span>}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 flex-wrap">
                    {getNextStatusOptions(load.status).map((nextStatus) => (
                      <Button
                        key={nextStatus}
                        onClick={() => updateLoadStatus(load.id, nextStatus)}
                        variant="outline"
                      >
                        Mark as {nextStatus.replace('_', ' ')}
                      </Button>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DriverPortal;