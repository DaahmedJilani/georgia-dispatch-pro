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
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SUBSCRIPTION_TIERS } from '@/lib/subscription-features';
import { FeatureList } from './FeatureList';
import { Loader2 } from 'lucide-react';

interface UpgradeDowngradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  currentTier: 'basic' | 'pro';
  companyName: string;
  onSuccess: () => void;
}

export function UpgradeDowngradeDialog({
  open,
  onOpenChange,
  companyId,
  currentTier,
  companyName,
  onSuccess,
}: UpgradeDowngradeDialogProps) {
  const [selectedTier, setSelectedTier] = useState<'basic' | 'pro'>(currentTier);
  const [loading, setLoading] = useState(false);

  const handleChangeTier = async () => {
    if (selectedTier === currentTier) {
      toast.error('Please select a different tier');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('companies')
        .update({ subscription_tier: selectedTier })
        .eq('id', companyId);

      if (error) throw error;

      const action = selectedTier === 'pro' ? 'upgraded to' : 'downgraded to';
      toast.success(
        `${companyName} ${action} ${SUBSCRIPTION_TIERS[selectedTier].name} ($${SUBSCRIPTION_TIERS[selectedTier].price}/mo)`
      );
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error changing tier:', error);
      toast.error('Failed to change subscription tier');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Change Subscription Tier</DialogTitle>
          <DialogDescription>
            Update the subscription tier for {companyName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <RadioGroup value={selectedTier} onValueChange={(v) => setSelectedTier(v as 'basic' | 'pro')}>
            <div className="space-y-4">
              <div
                className={`flex items-start space-x-4 p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedTier === 'basic' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                }`}
                onClick={() => setSelectedTier('basic')}
              >
                <RadioGroupItem value="basic" id="basic" className="mt-1" />
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="basic" className="text-lg font-semibold cursor-pointer">
                      Basic - $20/month
                    </Label>
                  </div>
                  <FeatureList tier="basic" />
                </div>
              </div>

              <div
                className={`flex items-start space-x-4 p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedTier === 'pro' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                }`}
                onClick={() => setSelectedTier('pro')}
              >
                <RadioGroupItem value="pro" id="pro" className="mt-1" />
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="pro" className="text-lg font-semibold cursor-pointer">
                      Pro - $50/month
                    </Label>
                  </div>
                  <FeatureList tier="pro" />
                </div>
              </div>
            </div>
          </RadioGroup>

          {selectedTier !== currentTier && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm">
                {selectedTier === 'pro' ? (
                  <>
                    <strong>Upgrading to Pro</strong> will immediately enable Driver Portal, Messages, Fleet
                    Map, and Invoices features. The subscription amount will change to $50/month.
                  </>
                ) : (
                  <>
                    <strong>Downgrading to Basic</strong> will immediately disable Driver Portal, Messages,
                    Fleet Map, and Invoices features. The subscription amount will change to $20/month.
                    Existing data will be preserved.
                  </>
                )}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleChangeTier} disabled={loading || selectedTier === currentTier}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {selectedTier === currentTier
              ? 'Select Different Tier'
              : selectedTier === 'pro'
                ? 'Upgrade to Pro'
                : 'Downgrade to Basic'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
