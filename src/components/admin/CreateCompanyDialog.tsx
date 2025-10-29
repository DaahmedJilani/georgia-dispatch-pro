import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { SUBSCRIPTION_TIERS } from '@/lib/subscription-features';

interface CreateCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateCompanyDialog({ open, onOpenChange, onSuccess }: CreateCompanyDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    adminEmail: '',
    adminFirstName: '',
    adminLastName: '',
    adminPassword: '',
    subscriptionTier: 'basic' as 'basic' | 'pro',
    phone: '',
    address: '',
  });

  const handleCreate = async () => {
    if (!formData.companyName || !formData.adminEmail || !formData.adminFirstName || !formData.adminLastName) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!formData.adminPassword || formData.adminPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-company-and-admin', {
        body: {
          companyName: formData.companyName,
          adminEmail: formData.adminEmail,
          adminFirstName: formData.adminFirstName,
          adminLastName: formData.adminLastName,
          adminPassword: formData.adminPassword,
          subscriptionTier: formData.subscriptionTier,
          phone: formData.phone || null,
          address: formData.address || null,
        },
      });

      if (error) throw error;

      toast.success(`Company "${formData.companyName}" created successfully`);
      setFormData({
        companyName: '',
        adminEmail: '',
        adminFirstName: '',
        adminLastName: '',
        adminPassword: '',
        subscriptionTier: 'basic',
        phone: '',
        address: '',
      });
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error creating company:', error);
      toast.error(error.message || 'Failed to create company');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Company</DialogTitle>
          <DialogDescription>
            Create a new company with an admin user. The admin will be able to login immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">
              Company Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="companyName"
              placeholder="Acme Logistics LLC"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="adminFirstName">
                Admin First Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="adminFirstName"
                placeholder="John"
                value={formData.adminFirstName}
                onChange={(e) => setFormData({ ...formData, adminFirstName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminLastName">
                Admin Last Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="adminLastName"
                placeholder="Doe"
                value={formData.adminLastName}
                onChange={(e) => setFormData({ ...formData, adminLastName: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adminEmail">
              Admin Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="adminEmail"
              type="email"
              placeholder="admin@acmelogistics.com"
              value={formData.adminEmail}
              onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="adminPassword">
              Admin Password <span className="text-destructive">*</span>
            </Label>
            <Input
              id="adminPassword"
              type="password"
              placeholder="Min. 6 characters"
              value={formData.adminPassword}
              onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Company Phone</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Company Address</Label>
            <Input
              id="address"
              placeholder="123 Main St, City, State 12345"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="space-y-3">
            <Label>Subscription Tier</Label>
            <RadioGroup
              value={formData.subscriptionTier}
              onValueChange={(v) => setFormData({ ...formData, subscriptionTier: v as 'basic' | 'pro' })}
            >
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="basic" id="tier-basic" />
                <Label htmlFor="tier-basic" className="flex-1 cursor-pointer">
                  <div className="font-semibold">Basic - $20/month</div>
                  <div className="text-xs text-muted-foreground">Core features only</div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="pro" id="tier-pro" />
                <Label htmlFor="tier-pro" className="flex-1 cursor-pointer">
                  <div className="font-semibold">Pro - $50/month</div>
                  <div className="text-xs text-muted-foreground">
                    Includes Driver Portal, Messages, Fleet Map, Invoices
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Company
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
