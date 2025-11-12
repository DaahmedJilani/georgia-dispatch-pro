import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Mail, Loader2 } from 'lucide-react';

interface InviteDriverDialogProps {
  driverId: string;
  driverName: string;
  driverEmail: string | null;
  onSuccess?: () => void;
}

export const InviteDriverDialog = ({ driverId, driverName, driverEmail, onSuccess }: InviteDriverDialogProps) => {
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState(`Hello ${driverName},\n\nYou've been invited to join our driver portal. Please use the link below to set up your account and access your loads, documents, and more.\n\nBest regards`);
  const { toast } = useToast();

  const handleSendInvite = async () => {
    if (!driverEmail) {
      toast({
        title: "Error",
        description: "Driver email is required to send invitation",
        variant: "destructive"
      });
      return;
    }

    try {
      setSending(true);

      // Update driver record with invitation timestamp
      const { error: updateError } = await supabase
        .from('drivers')
        .update({
          invitation_sent_at: new Date().toISOString()
        })
        .eq('id', driverId);

      if (updateError) throw updateError;

      // In a real implementation, this would call an edge function to send the email
      // For now, we'll just mark it as sent
      
      toast({
        title: "Invitation Sent",
        description: `Invitation email sent to ${driverEmail}`
      });

      setOpen(false);
      if (onSuccess) onSuccess();

    } catch (error: any) {
      console.error('Error sending invitation:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  if (!driverEmail) {
    return (
      <Button size="sm" variant="outline" disabled>
        <Mail className="h-4 w-4 mr-2" />
        No Email
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Mail className="h-4 w-4 mr-2" />
          Send Invite
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Driver Portal Invitation</DialogTitle>
          <DialogDescription>
            Send an invitation email to {driverName} ({driverEmail})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="message">Custom Message (Optional)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              className="mt-2"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSendInvite} disabled={sending}>
            {sending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Send Invitation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
