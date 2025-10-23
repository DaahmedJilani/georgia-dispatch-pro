import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { MapPin, Navigation } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DriverMapComponentProps {
  driverId: string;
  driverName: string;
  latitude?: number;
  longitude?: number;
  lastUpdate?: string;
}

export const DriverMapComponent = ({
  driverId,
  driverName,
  latitude,
  longitude,
  lastUpdate,
}: DriverMapComponentProps) => {
  const { toast } = useToast();
  const [map, setMap] = useState<any>(null);

  useEffect(() => {
    if (!latitude || !longitude) return;
    loadMap();
  }, [latitude, longitude]);

  const loadMap = () => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.log("Google Maps API key not configured");
      return;
    }

    if ((window as any).google?.maps) {
      initMap();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.defer = true;
    script.onload = () => initMap();
    document.head.appendChild(script);
  };

  const initMap = () => {
    if (!latitude || !longitude) return;
    
    const mapElement = document.getElementById(`map-${driverId}`);
    if (!mapElement || !(window as any).google) return;

    const google = (window as any).google;
    const position = { lat: latitude, lng: longitude };

    const mapInstance = new google.maps.Map(mapElement, {
      center: position,
      zoom: 12,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    });

    new google.maps.Marker({
      position,
      map: mapInstance,
      title: driverName,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: "#EF4444",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 2,
      },
    });

    setMap(mapInstance);
  };

  if (!latitude || !longitude) {
    return (
      <Card className="p-6 text-center">
        <MapPin className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-50" />
        <p className="text-sm text-muted-foreground">No location data available</p>
      </Card>
    );
  }

  return (
    <Card className="p-0 overflow-hidden">
      <div id={`map-${driverId}`} className="w-full h-[300px]" />
      {lastUpdate && (
        <div className="p-3 border-t bg-muted/30">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Navigation className="w-4 h-4" />
            <span>Last updated: {new Date(lastUpdate).toLocaleString()}</span>
          </div>
        </div>
      )}
    </Card>
  );
};
