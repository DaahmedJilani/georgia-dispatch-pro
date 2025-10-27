import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';

interface ExportButtonProps {
  onExport: () => void;
  label?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  disabled?: boolean;
}

export const ExportButton = ({
  onExport,
  label = 'Export',
  variant = 'outline',
  size = 'default',
  disabled = false,
}: ExportButtonProps) => {
  const { role, isMasterAdmin } = useUserRole();

  // Only admins and master admins can export
  if (role !== 'admin' && !isMasterAdmin) {
    return null;
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={onExport}
      disabled={disabled}
    >
      <Download className="mr-2 h-4 w-4" />
      {label}
    </Button>
  );
};
