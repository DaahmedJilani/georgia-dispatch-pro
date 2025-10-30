import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface EditCarrierDialogProps {
  carrier: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const EditCarrierDialog = ({ carrier, open, onOpenChange, onSuccess }: EditCarrierDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    mc_number: '',
    dot_number: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
  });

  useEffect(() => {
    if (carrier) {
      setFormData({
        name: carrier.name || '',
        mc_number: carrier.mc_number || '',
        dot_number: carrier.dot_number || '',
        email: carrier.email || '',
        phone: carrier.phone || '',
        address: carrier.address || '',
        notes: carrier.notes || '',
      });
    }
  }, [carrier]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast({
        title: 'Validation Error',
        description: 'Carrier name is required',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('carriers')
        .update({
          name: formData.name,
          mc_number: formData.mc_number || null,
          dot_number: formData.dot_number || null,
          email: formData.email || null,
          phone: formData.phone || null,
          address: formData.address || null,
          notes: formData.notes || null,
        })
        .eq('id', carrier.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Carrier updated successfully',
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating carrier:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update carrier',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Carrier</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name">Carrier Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="mc_number">MC Number</Label>
              <Input
                id="mc_number"
                value={formData.mc_number}
                onChange={(e) => setFormData({ ...formData, mc_number: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="dot_number">DOT Number</Label>
              <Input
                id="dot_number"
                value={formData.dot_number}
                onChange={(e) => setFormData({ ...formData, dot_number: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
