import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Navigation } from "lucide-react";

const Map = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loads, setLoads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);

  useEffect(() => {
    checkAuth();
    loadGoogleMapsScript();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const loadGoogleMapsScript = () => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      toast({
        title: "Error",
        description: "Google Maps API key not configured",
        variant: "destructive",
      });
      return;
    }

    if (window.google?.maps) {
      initMap();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.defer = true;
    script.onload = () => initMap();
    document.head.appendChild(script);
  };

  const initMap = async () => {
    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    const mapInstance = new google.maps.Map(mapElement, {
      center: { lat: 39.8283, lng: -98.5795 }, // Center of USA
      zoom: 4,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
    });

    setMap(mapInstance);
    await fetchLoads(mapInstance);
  };

  const fetchLoads = async (mapInstance: google.maps.Map) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("user_id", user.id)
        .single();

      if (!profile?.company_id) return;

      const { data, error } = await supabase
        .from("loads")
        .select(`
          *,
          drivers(first_name, last_name, current_location_lat, current_location_lng, last_location_update)
        `)
        .eq("company_id", profile.company_id)
        .in("status", ["assigned", "picked", "in_transit"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLoads(data || []);
      
      // Add markers for loads
      addMarkersToMap(data || [], mapInstance);
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

  const addMarkersToMap = (loadsData: any[], mapInstance: google.maps.Map) => {
    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    const newMarkers: google.maps.Marker[] = [];

    loadsData.forEach(load => {
      // Add driver location marker if available
      if (load.drivers?.current_location_lat && load.drivers?.current_location_lng) {
        const driverMarker = new google.maps.Marker({
          position: {
            lat: parseFloat(load.drivers.current_location_lat),
            lng: parseFloat(load.drivers.current_location_lng),
          },
          map: mapInstance,
          title: `Driver: ${load.drivers.first_name} ${load.drivers.last_name}`,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#EF4444',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          },
        });

        const driverInfo = new google.maps.InfoWindow({
          content: `
            <div style="padding: 8px;">
              <h3 style="font-weight: bold; margin-bottom: 4px;">Driver: ${load.drivers.first_name} ${load.drivers.last_name}</h3>
              <p style="margin: 2px 0;"><strong>Load:</strong> ${load.load_number}</p>
              <p style="margin: 2px 0;"><strong>Status:</strong> ${load.status}</p>
              <p style="margin: 2px 0; font-size: 12px; color: #666;">
                Last update: ${load.drivers.last_location_update ? new Date(load.drivers.last_location_update).toLocaleString() : 'N/A'}
              </p>
            </div>
          `,
        });

        driverMarker.addListener('click', () => {
          driverInfo.open(mapInstance, driverMarker);
        });

        newMarkers.push(driverMarker);
      }
    });

    setMarkers(newMarkers);
  };

  useEffect(() => {
    // Auto-refresh driver locations every 2 minutes
    const interval = setInterval(() => {
      if (map) {
        fetchLoads(map);
      }
    }, 120000);

    return () => clearInterval(interval);
  }, [map]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Live Map</h1>
            <p className="text-muted-foreground">Track active loads and driver locations in real-time</p>
          </div>
        </div>

        <Card className="p-0 overflow-hidden">
          {loading ? (
            <div className="h-[600px] flex items-center justify-center">
              <div className="text-center">
                <Navigation className="w-12 h-12 mx-auto mb-4 animate-pulse" />
                <p>Loading map...</p>
              </div>
            </div>
          ) : (
            <div id="map" className="w-full h-[600px]" />
          )}
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-red-500" />
              <div>
                <p className="font-medium">Driver Location</p>
                <p className="text-sm text-muted-foreground">Real-time GPS position</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-blue-500" />
              <div>
                <p className="font-medium">Pickup Location</p>
                <p className="text-sm text-muted-foreground">Load origin point</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-green-500" />
              <div>
                <p className="font-medium">Delivery Location</p>
                <p className="text-sm text-muted-foreground">Load destination</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Map;