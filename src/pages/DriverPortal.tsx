import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Upload, Clock, Check, X, Radio, History, Package } from "lucide-react";
import { PerformanceMetrics } from "@/components/driver/PerformanceMetrics";
import { GPSConsentDialog } from "@/components/map/GPSConsentDialog";
import { DriverLocationCard } from "@/components/map/DriverLocationCard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { notificationService } from "@/services/NotificationService";

const DriverPortal = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loads, setLoads] = useState<any[]>([]);
  const [loadHistory, setLoadHistory] = useState<any[]>([]);
  const [driverId, setDriverId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    totalLoads: 0,
    onTimeDeliveries: 0,
    totalEarnings: 0,
    averageDeliveryTime: 0,
    loadsThisMonth: 0,
  });
  const [trackingLocation, setTrackingLocation] = useState(false);
  const [showGPSConsent, setShowGPSConsent] = useState(false);
  const [gpsConsent, setGpsConsent] = useState(false);
  const [driverLocation, setDriverLocation] = useState<{
    lat: number | null;
    lng: number | null;
    lastUpdate: string | null;
  }>({ lat: null, lng: null, lastUpdate: null });
  const [driverName, setDriverName] = useState("");
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  useEffect(() => {
    checkAuth();
    fetchDriverLoads();
    checkGPSConsent();

    // Subscribe to load assignment notifications
    if (driverId) {
      const channel = notificationService.subscribeToDriverLoadAssignments(
        driverId,
        (newLoad) => {
          toast({
            title: "New Load Assigned!",
            description: `Load ${newLoad.load_number} has been assigned to you`,
          });
          fetchDriverLoads(); // Refresh loads list
        }
      );

      return () => {
        notificationService.unsubscribe(channel);
      };
    }
  }, [driverId]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const checkGPSConsent = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: driverData } = await supabase
        .from("drivers")
        .select("id, first_name, last_name, gps_consent, current_location_lat, current_location_lng, last_location_update")
        .eq("user_id", user.id)
        .single();

      if (driverData) {
        setDriverId(driverData.id);
        setDriverName(`${driverData.first_name} ${driverData.last_name}`);
        
        // Check GPS consent from database field
        const hasGpsConsent = driverData.gps_consent || false;
        setGpsConsent(hasGpsConsent);
        setDriverLocation({
          lat: driverData.current_location_lat,
          lng: driverData.current_location_lng,
          lastUpdate: driverData.last_location_update,
        });

        if (!hasGpsConsent) {
          setShowGPSConsent(true);
        } else {
          startLocationTracking();
        }
      }
    } catch (error: any) {
      console.error("GPS consent check error:", error);
    }
  };

  const handleGPSConsentResponse = (granted: boolean) => {
    setShowGPSConsent(false);
    setGpsConsent(granted);
    
    if (granted) {
      startLocationTracking();
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

      // Fetch active loads
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

      // Fetch completed loads history
      const { data: historyData } = await supabase
        .from("loads")
        .select(`
          *,
          brokers(name, company_name, phone)
        `)
        .eq("driver_id", driver.id)
        .eq("status", "delivered")
        .order("delivery_date", { ascending: false })
        .limit(20);

      setLoadHistory(historyData || []);

      // Calculate performance metrics
      const allDeliveredLoads = historyData || [];
      const totalDelivered = allDeliveredLoads.length;
      
      // Calculate on-time deliveries (delivered before or on delivery_date)
      const onTime = allDeliveredLoads.filter(load => {
        if (!load.delivery_date || !load.updated_at) return false;
        return new Date(load.updated_at) <= new Date(load.delivery_date);
      }).length;

      // Calculate total earnings from delivered loads
      const earnings = allDeliveredLoads.reduce((sum, load) => sum + (load.rate || 0), 0);

      // Calculate average delivery time
      const deliveryTimes = allDeliveredLoads
        .filter(load => load.pickup_date && load.delivery_date)
        .map(load => {
          const pickup = new Date(load.pickup_date).getTime();
          const delivery = new Date(load.delivery_date).getTime();
          return (delivery - pickup) / (1000 * 60 * 60); // hours
        });
      
      const avgTime = deliveryTimes.length > 0
        ? Math.round(deliveryTimes.reduce((sum, t) => sum + t, 0) / deliveryTimes.length)
        : 0;

      // Calculate loads this month
      const now = new Date();
      const thisMonth = allDeliveredLoads.filter(load => {
        if (!load.delivery_date) return false;
        const deliveryDate = new Date(load.delivery_date);
        return deliveryDate.getMonth() === now.getMonth() && 
               deliveryDate.getFullYear() === now.getFullYear();
      }).length;

      setPerformanceMetrics({
        totalLoads: totalDelivered,
        onTimeDeliveries: onTime,
        totalEarnings: earnings,
        averageDeliveryTime: avgTime,
        loadsThisMonth: thisMonth,
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

  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      console.log("Geolocation not supported");
      return;
    }

    if (!gpsConsent) {
      console.log("GPS consent not granted");
      return;
    }

    setTrackingLocation(true);

    // Update location immediately
    updateDriverLocation();

    // Update location every 2 minutes
    const interval = setInterval(() => {
      updateDriverLocation();
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  };

  const updateDriverLocation = () => {
    if (!driverId) return;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude, accuracy, heading, speed } = position.coords;
          
          // Call edge function for proper RLS handling
          const { data, error } = await supabase.functions.invoke('update-driver-location', {
            body: {
              driver_id: driverId,
              latitude,
              longitude,
              accuracy,
              heading,
              speed,
            },
          });

          if (error) throw error;

          setDriverLocation({
            lat: latitude,
            lng: longitude,
            lastUpdate: new Date().toISOString(),
          });

          console.log("Location updated successfully");
        } catch (error: any) {
          console.error("Error updating location:", error);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setTrackingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  };

  const updateLoadStatus = async (loadId: string, newStatus: 'assigned' | 'picked' | 'in_transit' | 'delivered', action?: string) => {
    try {
      const { error } = await supabase
        .from("loads")
        .update({ status: newStatus })
        .eq("id", loadId);

      if (error) throw error;

      toast({
        title: "Success",
        description: action ? `Load ${action} successfully` : "Load status updated successfully",
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

  const acceptLoad = async (loadId: string) => {
    await updateLoadStatus(loadId, 'assigned', 'accepted');
  };

  const rejectLoad = async (loadId: string) => {
    try {
      const { error } = await supabase
        .from("loads")
        .update({ 
          status: 'pending',
          driver_id: null 
        })
        .eq("id", loadId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Load rejected successfully",
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

  const uploadPOD = async (loadId: string, file: File) => {
    try {
      setLoading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${loadId}/pod-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Create document record
      const { error: dbError } = await supabase.from("documents").insert([
        {
          company_id: (await supabase.from('loads').select('company_id').eq('id', loadId).single()).data?.company_id,
          load_id: loadId,
          driver_id: driverId,
          file_name: file.name,
          file_path: fileName,
          document_type: 'proof_of_delivery',
          file_size: file.size,
          uploaded_by: (await supabase.auth.getUser()).data.user?.id,
        },
      ]);

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "POD uploaded successfully",
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
      <GPSConsentDialog
        open={showGPSConsent}
        onConsent={handleGPSConsentResponse}
        driverId={driverId || ""}
      />
      
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Driver Portal</h1>
            <p className="text-muted-foreground">Manage your assigned loads</p>
          </div>
          <div className="flex items-center gap-3">
            {trackingLocation && (
              <Badge variant="outline" className="gap-2">
                <Radio className="w-4 h-4 animate-pulse" />
                GPS Active
              </Badge>
            )}
          </div>
        </div>

        {/* Performance Metrics Dashboard */}
        <PerformanceMetrics
          totalLoads={performanceMetrics.totalLoads}
          onTimeDeliveries={performanceMetrics.onTimeDeliveries}
          totalEarnings={performanceMetrics.totalEarnings}
          averageDeliveryTime={performanceMetrics.averageDeliveryTime}
          loadsThisMonth={performanceMetrics.loadsThisMonth}
        />

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Loads</p>
                  <p className="text-3xl font-bold">{loads.length}</p>
                </div>
                <Package className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Completed</p>
                  <p className="text-3xl font-bold">{loadHistory.length}</p>
                </div>
                <History className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">All Time Loads</p>
                  <p className="text-3xl font-bold">{loads.length + loadHistory.length}</p>
                </div>
                <MapPin className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {!gpsConsent && (
          <Alert>
            <AlertDescription>
              Location sharing is off — your dispatcher cannot track you. Enable GPS tracking to allow real-time location updates.
            </AlertDescription>
          </Alert>
        )}

        {gpsConsent && (
          <DriverLocationCard
            latitude={driverLocation.lat}
            longitude={driverLocation.lng}
            lastUpdate={driverLocation.lastUpdate}
            driverName={driverName}
          />
        )}

        {/* Active Loads Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Active Loads</h2>
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
                    {load.status === 'assigned' && (
                      <>
                        <Button
                          onClick={() => acceptLoad(load.id)}
                          variant="default"
                          size="sm"
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Accept Load
                        </Button>
                        <Button
                          onClick={() => rejectLoad(load.id)}
                          variant="destructive"
                          size="sm"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Reject Load
                        </Button>
                      </>
                    )}
                    
                    {getNextStatusOptions(load.status).map((nextStatus) => (
                      <Button
                        key={nextStatus}
                        onClick={() => updateLoadStatus(load.id, nextStatus)}
                        variant="outline"
                        size="sm"
                      >
                        Mark as {nextStatus.replace('_', ' ')}
                      </Button>
                    ))}
                    
                    {(load.status === 'in_transit' || load.status === 'delivered') && (
                      <>
                        <input
                          type="file"
                          ref={(el) => (fileInputRefs.current[load.id] = el)}
                          style={{ display: 'none' }}
                          accept="image/*"
                          capture="environment"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) uploadPOD(load.id, file);
                          }}
                        />
                        <Button
                          onClick={() => fileInputRefs.current[load.id]?.click()}
                          variant="outline"
                          size="sm"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload POD
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
              ))}
            </div>
          )}
        </div>

        {/* Load History Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <History className="w-5 h-5" />
              Load History
            </h2>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
            >
              {showHistory ? 'Hide' : 'Show'} History
            </Button>
          </div>

          {showHistory && (
            loadHistory.length === 0 ? (
              <Card className="p-8">
                <p className="text-center text-muted-foreground">No completed loads yet</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {loadHistory.map((load) => (
                  <Card key={load.id} className="p-6 opacity-80">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-semibold">{load.load_number}</h3>
                          <p className="text-sm text-muted-foreground">{load.commodity || 'General Freight'}</p>
                        </div>
                        <Badge className="bg-green-500">DELIVERED</Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-blue-500 mt-1" />
                            <div>
                              <p className="font-medium">Pickup</p>
                              <p className="text-sm text-muted-foreground">
                                {load.pickup_city}, {load.pickup_state}
                              </p>
                              {load.pickup_date && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                  <Clock className="w-3 h-3" />
                                  {new Date(load.pickup_date).toLocaleDateString()}
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
                              <p className="text-sm text-muted-foreground">
                                {load.delivery_city}, {load.delivery_state}
                              </p>
                              {load.delivery_date && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                  <Clock className="w-3 h-3" />
                                  {new Date(load.delivery_date).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {load.brokers && (
                        <div className="pt-2 border-t">
                          <p className="text-sm">
                            <span className="font-medium">Broker:</span> {load.brokers.name}
                          </p>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DriverPortal;
