import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapPin, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface GPSConsentDialogProps {
  open: boolean;
  onConsent: (granted: boolean) => void;
  driverId: string;
}

export const GPSConsentDialog = ({ open, onConsent, driverId }: GPSConsentDialogProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleConsent = async (granted: boolean) => {
    setLoading(true);
    
    try {
      // Note: gps_consent field will be available after migration
      // For now we'll just handle permission request

      if (granted) {
        // Request geolocation permission
        if (!navigator.geolocation) {
          toast({
            title: "Error",
            description: "Geolocation not supported by your browser",
            variant: "destructive",
          });
          onConsent(false);
          return;
        }

        navigator.geolocation.getCurrentPosition(
          () => {
            toast({
              title: "Location Sharing Enabled",
              description: "Your dispatcher can now track your location",
            });
            onConsent(true);
          },
          (error) => {
            console.error("Geolocation error:", error);
            toast({
              title: "Permission Denied",
              description: "Please enable location access in your browser settings",
              variant: "destructive",
            });
            onConsent(false);
          }
        );
      } else {
        toast({
          title: "Location Sharing Disabled",
          description: "Your dispatcher cannot track your location",
        });
        onConsent(false);
      }
    } catch (error: any) {
      console.error("GPS consent error:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-full bg-primary/10">
              <MapPin className="w-6 h-6 text-primary" />
            </div>
            <DialogTitle>Enable Location Sharing?</DialogTitle>
          </div>
          <DialogDescription className="space-y-3 text-left">
            <p>
              We'd like to share your real-time location with your dispatcher to:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Help coordinate load pickups and deliveries</li>
              <li>Provide better route guidance and support</li>
              <li>Improve overall fleet efficiency</li>
            </ul>
            <div className="flex items-start gap-2 p-3 bg-muted rounded-md mt-3">
              <AlertCircle className="w-4 h-4 mt-0.5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                Your location is only shared when you're logged in and on active loads. 
                You can disable this anytime in settings.
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleConsent(false)}
            disabled={loading}
          >
            Not Now
          </Button>
          <Button
            onClick={() => handleConsent(true)}
            disabled={loading}
          >
            {loading ? "Enabling..." : "Enable Location"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
