import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { GPSStatusBadge } from "./GPSStatusBadge";
import { mapService } from "@/services/MapService";
import { useToast } from "@/hooks/use-toast";

interface DriverLocationCardProps {
  latitude: number | null;
  longitude: number | null;
  lastUpdate: string | null;
  driverName: string;
}

export const DriverLocationCard = ({
  latitude,
  longitude,
  lastUpdate,
  driverName,
}: DriverLocationCardProps) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (latitude && longitude) {
      loadMap();
    }
  }, [latitude, longitude]);

  const loadMap = async () => {
    try {
      await mapService.loadGoogleMaps();
      const google = mapService.getGoogle();
      
      if (!google) return;

      const mapElement = document.getElementById('driver-location-map');
      if (!mapElement) return;

      const map = new google.maps.Map(mapElement, {
        center: { lat: Number(latitude), lng: Number(longitude) },
        zoom: 13,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      new google.maps.Marker({
        position: { lat: Number(latitude), lng: Number(longitude) },
        map,
        title: driverName,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#EF4444',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });

      setMapLoaded(true);
    } catch (error: any) {
      console.error('Map loading error:', error);
      toast({
        title: "Map Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (!latitude || !longitude) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <MapPin className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold">Your Location</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Location data not available. Make sure GPS is enabled.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <MapPin className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Your Location</h3>
        </div>
        <GPSStatusBadge lastUpdate={lastUpdate} />
      </div>
      
      <div 
        id="driver-location-map" 
        className="w-full h-64 rounded-lg bg-muted"
      />
      
      {lastUpdate && (
        <p className="text-xs text-muted-foreground mt-3">
          Last updated: {new Date(lastUpdate).toLocaleString()}
        </p>
      )}
    </Card>
  );
};
