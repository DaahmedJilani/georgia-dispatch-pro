import { supabase } from "@/integrations/supabase/client";

export class NotificationService {
  private static instance: NotificationService;
  private permissionGranted = false;

  private constructor() {
    this.checkPermission();
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async requestPermission(): Promise<boolean> {
    if (!("Notification" in window)) {
      console.log("This browser does not support notifications");
      return false;
    }

    if (Notification.permission === "granted") {
      this.permissionGranted = true;
      return true;
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      this.permissionGranted = permission === "granted";
      return this.permissionGranted;
    }

    return false;
  }

  private checkPermission() {
    if ("Notification" in window && Notification.permission === "granted") {
      this.permissionGranted = true;
    }
  }

  showNotification(title: string, options?: NotificationOptions) {
    if (!this.permissionGranted) {
      console.log("Notification permission not granted");
      return;
    }

    try {
      new Notification(title, {
        icon: "/favicon.png",
        badge: "/favicon.png",
        ...options,
      });
    } catch (error) {
      console.error("Error showing notification:", error);
    }
  }

  // Subscribe to load assignments for drivers
  subscribeToDriverLoadAssignments(driverId: string, callback: (load: any) => void) {
    const channel = supabase
      .channel(`driver-loads-${driverId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'loads',
          filter: `driver_id=eq.${driverId}`,
        },
        (payload) => {
          const newData = payload.new as any;
          const oldData = payload.old as any;

          // Check if status changed to assigned
          if (oldData.status !== 'assigned' && newData.status === 'assigned') {
            this.showNotification('New Load Assigned!', {
              body: `Load ${newData.load_number} has been assigned to you`,
              tag: `load-${newData.id}`,
            });
            callback(newData);
          }
        }
      )
      .subscribe();

    return channel;
  }

  // Subscribe to load status changes for dispatchers
  subscribeToLoadStatusChanges(companyId: string, callback: (load: any) => void) {
    const channel = supabase
      .channel(`load-status-${companyId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'loads',
          filter: `company_id=eq.${companyId}`,
        },
        (payload) => {
          const newData = payload.new as any;
          const oldData = payload.old as any;

          if (oldData.status !== newData.status) {
            this.showNotification('Load Status Updated', {
              body: `Load ${newData.load_number} status changed from ${oldData.status} to ${newData.status}`,
              tag: `load-status-${newData.id}`,
            });
            callback(newData);
          }
        }
      )
      .subscribe();

    return channel;
  }

  // Subscribe to invoice updates for treasury
  subscribeToInvoiceUpdates(companyId: string, callback: (invoice: any) => void) {
    const channel = supabase
      .channel(`invoices-${companyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invoices',
          filter: `company_id=eq.${companyId}`,
        },
        (payload) => {
          const newData = payload.new as any;
          
          if (payload.eventType === 'INSERT') {
            this.showNotification('New Invoice Created', {
              body: `Invoice ${newData.invoice_number} for $${newData.amount}`,
              tag: `invoice-${newData.id}`,
            });
          } else if (payload.eventType === 'UPDATE') {
            const oldData = payload.old as any;
            if (oldData.payment_status !== newData.payment_status) {
              this.showNotification('Invoice Payment Updated', {
                body: `Invoice ${newData.invoice_number} is now ${newData.payment_status}`,
                tag: `invoice-payment-${newData.id}`,
              });
            }
          }
          
          callback(newData);
        }
      )
      .subscribe();

    return channel;
  }

  // Unsubscribe from a channel
  unsubscribe(channel: any) {
    if (channel) {
      supabase.removeChannel(channel);
    }
  }
}

export const notificationService = NotificationService.getInstance();
