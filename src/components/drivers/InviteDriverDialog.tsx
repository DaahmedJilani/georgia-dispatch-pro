import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { UserPlus } from 'lucide-react';

interface InviteDriverDialogProps {
  companyId: string;
  onSuccess?: () => void;
}

export const InviteDriverDialog = ({ companyId, onSuccess }: InviteDriverDialogProps) => {
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [carriers, setCarriers] = useState<any[]>([]);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    carrier_id: '',
    license_number: '',
    license_expiry: '',
  });

  useEffect(() => {
    if (open) {
      fetchCarriers();
    }
  }, [open]);

  const fetchCarriers = async () => {
    try {
      const { data, error } = await supabase
        .from('carriers')
        .select('*')
        .eq('company_id', companyId)
        .order('name');

      if (error) throw error;
      setCarriers(data || []);
    } catch (error: any) {
      console.error('Error fetching carriers:', error);
    }
  };

  const handleInvite = async () => {
    if (!formData.email || !formData.firstName || !formData.lastName || !formData.carrier_id) {
      toast({
        title: 'Missing Information',
        description: 'Please provide email, name, and carrier',
        variant: 'destructive',
      });
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('invite-driver', {
        body: {
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          carrierId: formData.carrier_id,
          licenseNumber: formData.license_number,
          licenseExpiry: formData.license_expiry,
          companyId,
        },
      });

      if (error) throw error;

      toast({
        title: 'Driver Invited',
        description: 'Driver will receive an email to set up their account',
      });

      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        phone: '',
        carrier_id: '',
        license_number: '',
        license_expiry: '',
      });

      setOpen(false);
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error('Error inviting driver:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to invite driver',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite Driver
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Invite Driver to Portal</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>First Name *</Label>
              <Input
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="John"
              />
            </div>
            <div>
              <Label>Last Name *</Label>
              <Input
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Doe"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="driver@example.com"
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>

          <div>
            <Label>Carrier *</Label>
            <Select 
              value={formData.carrier_id} 
              onValueChange={(value) => setFormData({ ...formData, carrier_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select carrier" />
              </SelectTrigger>
              <SelectContent>
                {carriers.map(carrier => (
                  <SelectItem key={carrier.id} value={carrier.id}>
                    {carrier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>License Number</Label>
              <Input
                value={formData.license_number}
                onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                placeholder="DL123456"
              />
            </div>
            <div>
              <Label>License Expiry</Label>
              <Input
                type="date"
                value={formData.license_expiry}
                onChange={(e) => setFormData({ ...formData, license_expiry: e.target.value })}
              />
            </div>
          </div>

          <Button onClick={handleInvite} disabled={sending} className="w-full">
            {sending ? 'Sending Invitation...' : 'Send Invitation'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
