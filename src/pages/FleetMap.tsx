import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Navigation, Search } from "lucide-react";
import { mapService } from "@/services/MapService";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { DriverSidePanel } from "@/components/map/DriverSidePanel";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface Driver {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  current_location_lat: number | null;
  current_location_lng: number | null;
  last_location_update: string | null;
  status: string;
  loads?: {
    load_number: string;
    pickup_city: string | null;
    pickup_state: string | null;
    delivery_city: string | null;
    delivery_state: string | null;
    status: string;
    brokers?: {
      name: string;
      phone: string | null;
    };
  } | null;
}

const FleetMap = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [filteredDrivers, setFilteredDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [map, setMap] = useState<any>(null);
  const [markerClusterer, setMarkerClusterer] = useState<any>(null);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
    loadMap();
  }, []);

  useEffect(() => {
    if (map) {
      fetchDrivers();
      
      // Subscribe to real-time updates
      const channel = supabase
        .channel('fleet-driver-locations')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'drivers'
          },
          () => {
            console.log('Driver location updated');
            fetchDrivers();
          }
        )
        .subscribe();

      // Auto-refresh every 90 seconds
      const interval = setInterval(() => {
        fetchDrivers();
      }, 90000);

      return () => {
        supabase.removeChannel(channel);
        clearInterval(interval);
      };
    }
  }, [map]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = drivers.filter(driver =>
        `${driver.first_name} ${driver.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredDrivers(filtered);
    } else {
      setFilteredDrivers(drivers);
    }
  }, [searchQuery, drivers]);

  useEffect(() => {
    if (map && filteredDrivers.length > 0) {
      updateMapMarkers(filteredDrivers);
    }
  }, [filteredDrivers, map]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const loadMap = async () => {
    try {
      await mapService.loadGoogleMaps();
      const google = mapService.getGoogle();
      
      if (!google) {
        setMapError("Google Maps not available");
        return;
      }

      const mapElement = document.getElementById('fleet-map');
      if (!mapElement) return;

      const mapInstance = new google.maps.Map(mapElement, {
        center: { lat: 39.8283, lng: -98.5795 }, // Center of USA
        zoom: 4,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
      });

      setMap(mapInstance);
      setMapError(null);
    } catch (error: any) {
      console.error('Map loading error:', error);
      setMapError(error.message);
      toast({
        title: "Map Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchDrivers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id, is_master_admin")
        .eq("user_id", user.id)
        .single();

      if (!profile) return;

      let query = supabase
        .from("drivers")
        .select(`
          *,
          loads!loads_driver_id_fkey(
            load_number,
            pickup_city,
            pickup_state,
            delivery_city,
            delivery_state,
            status,
            brokers(name, phone)
          )
        `)
        .not("current_location_lat", "is", null)
        .not("current_location_lng", "is", null)
        .in("status", ["assigned", "in_transit"])
        .order("last_location_update", { ascending: false });

      // Filter by company unless master admin
      if (!profile.is_master_admin && profile.company_id) {
        query = query.eq("company_id", profile.company_id);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Get only first load if multiple loads exist
      const processedDrivers = (data || []).map(driver => ({
        ...driver,
        loads: Array.isArray(driver.loads) ? driver.loads[0] : driver.loads
      }));

      setDrivers(processedDrivers);
      setFilteredDrivers(processedDrivers);
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

  const updateMapMarkers = (driversData: Driver[]) => {
    if (!map) return;
    
    const google = mapService.getGoogle();
    if (!google) return;

    // Clear existing clusterer
    if (markerClusterer) {
      markerClusterer.clearMarkers();
    }

    const markers = driversData.map(driver => {
      if (!driver.current_location_lat || !driver.current_location_lng) return null;

      const minutesAgo = driver.last_location_update
        ? Math.floor((Date.now() - new Date(driver.last_location_update).getTime()) / 60000)
        : 999;

      let markerColor = '#EF4444'; // Red - Offline
      if (minutesAgo < 5) markerColor = '#22C55E'; // Green - Active
      else if (minutesAgo < 30) markerColor = '#EAB308'; // Yellow - Idle

      const marker = new google.maps.Marker({
        position: {
          lat: Number(driver.current_location_lat),
          lng: Number(driver.current_location_lng),
        },
        map,
        title: `${driver.first_name} ${driver.last_name}`,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: markerColor,
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });

      marker.addListener('click', () => {
        setSelectedDriver(driver);
      });

      return marker;
    }).filter(Boolean);

    // Create marker clusterer
    const clusterer = new MarkerClusterer({
      map,
      markers: markers as google.maps.Marker[],
    });

    setMarkerClusterer(clusterer);
  };

  const getStatusCounts = () => {
    const active = filteredDrivers.filter(d => {
      const minutesAgo = d.last_location_update
        ? Math.floor((Date.now() - new Date(d.last_location_update).getTime()) / 60000)
        : 999;
      return minutesAgo < 5;
    }).length;

    const idle = filteredDrivers.filter(d => {
      const minutesAgo = d.last_location_update
        ? Math.floor((Date.now() - new Date(d.last_location_update).getTime()) / 60000)
        : 999;
      return minutesAgo >= 5 && minutesAgo < 30;
    }).length;

    const offline = filteredDrivers.filter(d => {
      const minutesAgo = d.last_location_update
        ? Math.floor((Date.now() - new Date(d.last_location_update).getTime()) / 60000)
        : 999;
      return minutesAgo >= 30;
    }).length;

    return { active, idle, offline };
  };

  const statusCounts = getStatusCounts();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Fleet Map</h1>
            <p className="text-muted-foreground">
              Track driver locations and active loads in real-time
            </p>
          </div>
        </div>

        {mapError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {mapError} - Please check your Google Maps API configuration.
            </AlertDescription>
          </Alert>
        )}

        {/* Search and Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search drivers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <div>
                <p className="text-2xl font-bold">{statusCounts.active}</p>
                <p className="text-xs text-muted-foreground">Active (&lt; 5min)</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{statusCounts.idle}</p>
                <p className="text-xs text-muted-foreground">Idle (5-30min)</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div>
                <p className="text-2xl font-bold">{statusCounts.offline}</p>
                <p className="text-xs text-muted-foreground">Offline (&gt; 30min)</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Map */}
        <Card className="p-0 overflow-hidden relative">
          {loading ? (
            <div className="h-[600px] flex items-center justify-center">
              <div className="text-center">
                <Navigation className="w-12 h-12 mx-auto mb-4 animate-pulse" />
                <p>Loading fleet map...</p>
              </div>
            </div>
          ) : (
            <>
              <div id="fleet-map" className="w-full h-[600px]" />
              {selectedDriver && (
                <DriverSidePanel
                  driver={selectedDriver}
                  onClose={() => setSelectedDriver(null)}
                />
              )}
            </>
          )}
        </Card>

        {/* Legend */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-green-500" />
              <div>
                <p className="font-medium">Active</p>
                <p className="text-sm text-muted-foreground">Updated &lt; 5 minutes ago</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-yellow-500" />
              <div>
                <p className="font-medium">Idle</p>
                <p className="text-sm text-muted-foreground">Updated 5-30 minutes ago</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-red-500" />
              <div>
                <p className="font-medium">Offline</p>
                <p className="text-sm text-muted-foreground">Updated &gt; 30 minutes ago</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FleetMap;
