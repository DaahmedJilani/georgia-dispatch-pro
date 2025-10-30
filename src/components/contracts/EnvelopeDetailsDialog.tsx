import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EnvelopeStatusBadge } from './EnvelopeStatusBadge';
import { EnvelopeTimeline } from './EnvelopeTimeline';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';

interface EnvelopeDetailsDialogProps {
  envelope: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EnvelopeDetailsDialog = ({ 
  envelope, 
  open, 
  onOpenChange 
}: EnvelopeDetailsDialogProps) => {
  const { role } = useUserRole();
  const canDownload = role === 'admin';

  const handleDownload = () => {
    if (envelope.signed_document_url && canDownload) {
      window.open(envelope.signed_document_url, '_blank');
    }
  };

  const handleViewSigning = () => {
    if (envelope.signing_url) {
      window.open(envelope.signing_url, '_blank');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Contract Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Status</p>
              <EnvelopeStatusBadge status={envelope.status} size="lg" />
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Signer</p>
              <p className="font-medium">{envelope.signer_name}</p>
              <p className="text-sm text-muted-foreground">{envelope.signer_email}</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-3">Signing Timeline</p>
            <EnvelopeTimeline envelope={envelope} />
          </div>

          <div className="space-y-2">
            {envelope.status === 'signed' && envelope.signed_document_url && (
              <>
                {canDownload ? (
                  <Button onClick={handleDownload} className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Download Signed Contract
                  </Button>
                ) : (
                  <div className="p-3 bg-muted rounded-md text-center">
                    <p className="text-sm text-muted-foreground">
                      🔒 Only administrators can download signed contracts
                    </p>
                  </div>
                )}
              </>
            )}

            {envelope.status === 'sent' && envelope.signing_url && (
              <Button onClick={handleViewSigning} variant="outline" className="w-full">
                <ExternalLink className="mr-2 h-4 w-4" />
                View Signing Page
              </Button>
            )}

            {envelope.status === 'declined' && (
              <div className="p-3 bg-destructive/10 rounded-md">
                <p className="text-sm text-destructive">
                  This contract was declined by the signer.
                </p>
              </div>
            )}

            {envelope.status === 'expired' && (
              <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-md">
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  This contract has expired. You can resend it from the carrier page.
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
