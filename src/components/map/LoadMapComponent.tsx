import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { MapPin, Navigation } from "lucide-react";

interface LoadMapComponentProps {
  loadId: string;
  pickupLat?: number;
  pickupLng?: number;
  deliveryLat?: number;
  deliveryLng?: number;
  driverLat?: number;
  driverLng?: number;
  driverName?: string;
}

export const LoadMapComponent = ({
  loadId,
  pickupLat,
  pickupLng,
  deliveryLat,
  deliveryLng,
  driverLat,
  driverLng,
  driverName,
}: LoadMapComponentProps) => {
  const [map, setMap] = useState<any>(null);

  useEffect(() => {
    loadMap();
  }, [pickupLat, pickupLng, deliveryLat, deliveryLng, driverLat, driverLng]);

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
    const mapElement = document.getElementById(`load-map-${loadId}`);
    if (!mapElement || !(window as any).google) return;

    const google = (window as any).google;
    
    // Default center (USA)
    let center = { lat: 39.8283, lng: -98.5795 };
    let zoom = 4;

    // If we have coordinates, center on them
    if (pickupLat && pickupLng) {
      center = { lat: pickupLat, lng: pickupLng };
      zoom = 6;
    }

    const mapInstance = new google.maps.Map(mapElement, {
      center,
      zoom,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    });

    const bounds = new google.maps.LatLngBounds();

    // Add pickup marker
    if (pickupLat && pickupLng) {
      const pickupMarker = new google.maps.Marker({
        position: { lat: pickupLat, lng: pickupLng },
        map: mapInstance,
        title: "Pickup Location",
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#10B981",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });
      bounds.extend(pickupMarker.getPosition()!);
    }

    // Add delivery marker
    if (deliveryLat && deliveryLng) {
      const deliveryMarker = new google.maps.Marker({
        position: { lat: deliveryLat, lng: deliveryLng },
        map: mapInstance,
        title: "Delivery Location",
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#EF4444",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });
      bounds.extend(deliveryMarker.getPosition()!);
    }

    // Add driver marker
    if (driverLat && driverLng) {
      const driverMarker = new google.maps.Marker({
        position: { lat: driverLat, lng: driverLng },
        map: mapInstance,
        title: `Driver: ${driverName || "Current Driver"}`,
        icon: {
          path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: 6,
          fillColor: "#3B82F6",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });
      bounds.extend(driverMarker.getPosition()!);
    }

    // Fit bounds if we have multiple markers
    if ((pickupLat && pickupLng) || (deliveryLat && deliveryLng) || (driverLat && driverLng)) {
      mapInstance.fitBounds(bounds);
    }

    setMap(mapInstance);
  };

  return (
    <Card className="p-0 overflow-hidden">
      <div id={`load-map-${loadId}`} className="w-full h-[400px]" />
      <div className="p-3 border-t bg-muted/30">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-muted-foreground">Pickup</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-muted-foreground">Delivery</span>
          </div>
          {driverLat && driverLng && (
            <div className="flex items-center gap-2">
              <Navigation className="w-3 h-3 text-blue-500" />
              <span className="text-muted-foreground">Driver</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
