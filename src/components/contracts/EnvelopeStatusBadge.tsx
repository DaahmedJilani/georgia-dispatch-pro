import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, Clock, Eye, XCircle, 
  AlertCircle, FileText, HourglassIcon 
} from 'lucide-react';

interface EnvelopeStatusBadgeProps {
  status: 'draft' | 'sent' | 'viewed' | 'signed' | 'declined' | 'expired' | 'error';
  size?: 'sm' | 'default' | 'lg';
  showIcon?: boolean;
}

export const EnvelopeStatusBadge = ({ 
  status, 
  size = 'default',
  showIcon = true 
}: EnvelopeStatusBadgeProps) => {
  const config = {
    draft: {
      label: 'Draft',
      icon: FileText,
      className: 'bg-muted text-muted-foreground',
    },
    sent: {
      label: 'Sent',
      icon: Clock,
      className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    },
    viewed: {
      label: 'Viewed',
      icon: Eye,
      className: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    },
    signed: {
      label: 'Signed',
      icon: CheckCircle,
      className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    },
    declined: {
      label: 'Declined',
      icon: XCircle,
      className: 'bg-destructive/10 text-destructive',
    },
    expired: {
      label: 'Expired',
      icon: HourglassIcon,
      className: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    },
    error: {
      label: 'Error',
      icon: AlertCircle,
      className: 'bg-destructive/10 text-destructive',
    },
  };

  const { label, icon: Icon, className } = config[status];

  return (
    <Badge className={className}>
      {showIcon && <Icon className="mr-1 h-3 w-3" />}
      {label}
    </Badge>
  );
};
