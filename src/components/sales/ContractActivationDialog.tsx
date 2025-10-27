import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { FileCheck, Send } from 'lucide-react';

interface ContractActivationDialogProps {
  carrier: {
    id: string;
    name: string;
    email: string;
  };
  onSuccess?: () => void;
}

export const ContractActivationDialog = ({ carrier, onSuccess }: ContractActivationDialogProps) => {
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [signerEmail, setSignerEmail] = useState(carrier.email || '');
  const [signerName, setSignerName] = useState('');
  const { toast } = useToast();

  const sendContract = async () => {
    if (!signerEmail || !signerName) {
      toast({
        title: 'Missing Information',
        description: 'Please provide signer name and email',
        variant: 'destructive',
      });
      return;
    }

    setSending(true);
    try {
      // Call edge function to send DocuSign contract
      const { data, error } = await supabase.functions.invoke('send-docusign-contract', {
        body: {
          carrierId: carrier.id,
          carrierName: carrier.name,
          signerEmail,
          signerName,
        },
      });

      if (error) throw error;

      // Update carrier status to 'sent'
      await supabase
        .from('carriers')
        .update({
          contract_status: 'sent',
          sale_stage: 'closed',
        })
        .eq('id', carrier.id);

      toast({
        title: 'Contract Sent',
        description: `DocuSign contract sent to ${signerEmail}`,
      });

      setOpen(false);
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error('Error sending contract:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send contract',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <FileCheck className="mr-2 h-4 w-4" />
          Send Contract
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Onboarding Contract</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Carrier Name</Label>
            <Input value={carrier.name} disabled />
          </div>
          <div>
            <Label>Signer Name</Label>
            <Input
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              placeholder="Full name of the person signing"
            />
          </div>
          <div>
            <Label>Signer Email</Label>
            <Input
              type="email"
              value={signerEmail}
              onChange={(e) => setSignerEmail(e.target.value)}
              placeholder="email@example.com"
            />
          </div>
          <Button onClick={sendContract} disabled={sending} className="w-full">
            <Send className="mr-2 h-4 w-4" />
            {sending ? 'Sending...' : 'Send DocuSign Contract'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
