import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, X } from "lucide-react";
import { notificationService } from "@/services/NotificationService";

export const NotificationPermissionPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
      
      // Show prompt if permission is default and user hasn't dismissed
      const dismissed = localStorage.getItem('notification-prompt-dismissed');
      if (Notification.permission === "default" && !dismissed) {
        // Delay showing prompt by 3 seconds
        setTimeout(() => setShowPrompt(true), 3000);
      }
    }
  }, []);

  const handleEnable = async () => {
    const granted = await notificationService.requestPermission();
    if (granted) {
      setPermission("granted");
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('notification-prompt-dismissed', 'true');
    setShowPrompt(false);
  };

  if (!showPrompt || permission !== "default") return null;

  return (
    <div className="fixed top-20 right-4 z-50 w-96 max-w-[calc(100vw-2rem)]">
      <Card className="shadow-2xl border-2 border-primary/20 animate-in slide-in-from-top">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Enable Notifications</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Get instant alerts for load assignments, status changes, and important updates
              </p>
              <div className="flex gap-2">
                <Button onClick={handleEnable} size="sm">
                  Enable
                </Button>
                <Button onClick={handleDismiss} variant="ghost" size="sm">
                  <X className="w-4 h-4 mr-1" />
                  Later
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
