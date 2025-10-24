import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { X, Phone, MessageSquare, MapPin, Package } from "lucide-react";
import { GPSStatusBadge } from "./GPSStatusBadge";

interface DriverSidePanelProps {
  driver: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string | null;
    current_location_lat: number | null;
    current_location_lng: number | null;
    last_location_update: string | null;
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
  };
  onClose: () => void;
}

export const DriverSidePanel = ({ driver, onClose }: DriverSidePanelProps) => {
  return (
    <Card className="absolute top-4 right-4 w-96 max-h-[calc(100vh-2rem)] overflow-y-auto z-10 shadow-lg">
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">
              {driver.first_name} {driver.last_name}
            </h3>
            <p className="text-sm text-muted-foreground">{driver.phone || "No phone"}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* GPS Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">GPS Status</span>
          <GPSStatusBadge lastUpdate={driver.last_location_update} />
        </div>

        {driver.last_location_update && (
          <p className="text-xs text-muted-foreground">
            Last updated: {new Date(driver.last_location_update).toLocaleString()}
          </p>
        )}

        <Separator />

        {/* Contact Actions */}
        <div className="flex gap-2">
          {driver.phone && (
            <>
              <Button variant="outline" className="flex-1" asChild>
                <a href={`tel:${driver.phone}`}>
                  <Phone className="w-4 h-4 mr-2" />
                  Call
                </a>
              </Button>
              <Button variant="outline" className="flex-1" asChild>
                <a href={`sms:${driver.phone}`}>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Text
                </a>
              </Button>
            </>
          )}
        </div>

        <Separator />

        {/* Load Information */}
        {driver.loads ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              <h4 className="font-semibold">Current Load</h4>
            </div>

            <div className="space-y-2">
              <div>
                <p className="text-sm font-medium">Load #{driver.loads.load_number}</p>
                <p className="text-xs text-muted-foreground">
                  Status: <span className="capitalize">{driver.loads.status.replace('_', ' ')}</span>
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-green-500 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium">Pickup</p>
                    <p className="text-xs text-muted-foreground">
                      {driver.loads.pickup_city}, {driver.loads.pickup_state}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-red-500 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium">Delivery</p>
                    <p className="text-xs text-muted-foreground">
                      {driver.loads.delivery_city}, {driver.loads.delivery_state}
                    </p>
                  </div>
                </div>
              </div>

              {driver.loads.brokers && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs font-medium">Broker</p>
                    <p className="text-sm">{driver.loads.brokers.name}</p>
                    {driver.loads.brokers.phone && (
                      <p className="text-xs text-muted-foreground">
                        {driver.loads.brokers.phone}
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <Package className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No active load assigned</p>
          </div>
        )}
      </div>
    </Card>
  );
};
