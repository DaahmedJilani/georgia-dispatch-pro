import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2, Upload } from 'lucide-react';
import { uploadFile } from '@/utils/fileUpload';
import { useToast } from '@/hooks/use-toast';

interface Driver {
  id?: string;
  name: string;
  phone: string;
  license_number: string;
  license_expiration: string;
  cdl_class: string;
  experience_years: number;
  license_file_url?: string;
  medical_card_url?: string;
  signed_agreement_url?: string;
}

interface DriverEntryCardProps {
  driver: Driver;
  index: number;
  companyId: string;
  onChange: (index: number, field: keyof Driver, value: any) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
}

export const DriverEntryCard = ({
  driver,
  index,
  companyId,
  onChange,
  onRemove,
  canRemove,
}: DriverEntryCardProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState<{ [key: string]: boolean }>({});

  const handleFileUpload = async (field: 'license_file_url' | 'medical_card_url' | 'signed_agreement_url', file: File) => {
    setUploading({ ...uploading, [field]: true });
    try {
      const result = await uploadFile(file, `driver-documents/${companyId}`);
      onChange(index, field, result.path);
      toast({
        title: 'Success',
        description: 'File uploaded successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading({ ...uploading, [field]: false });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Driver {index + 1}</CardTitle>
        {canRemove && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(index)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`driver-name-${index}`}>Full Name *</Label>
            <Input
              id={`driver-name-${index}`}
              value={driver.name}
              onChange={(e) => onChange(index, 'name', e.target.value)}
              placeholder="John Doe"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`driver-phone-${index}`}>Phone Number *</Label>
            <Input
              id={`driver-phone-${index}`}
              type="tel"
              value={driver.phone}
              onChange={(e) => onChange(index, 'phone', e.target.value)}
              placeholder="555-555-5555"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`driver-license-${index}`}>License Number *</Label>
            <Input
              id={`driver-license-${index}`}
              value={driver.license_number}
              onChange={(e) => onChange(index, 'license_number', e.target.value)}
              placeholder="A1234567"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`driver-license-exp-${index}`}>License Expiration *</Label>
            <Input
              id={`driver-license-exp-${index}`}
              type="date"
              value={driver.license_expiration}
              onChange={(e) => onChange(index, 'license_expiration', e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`driver-cdl-${index}`}>CDL Class *</Label>
            <Input
              id={`driver-cdl-${index}`}
              value={driver.cdl_class}
              onChange={(e) => onChange(index, 'cdl_class', e.target.value)}
              placeholder="A, B, or C"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`driver-exp-${index}`}>Years of Experience *</Label>
            <Input
              id={`driver-exp-${index}`}
              type="number"
              min="0"
              value={driver.experience_years}
              onChange={(e) => onChange(index, 'experience_years', parseInt(e.target.value) || 0)}
              required
            />
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t">
          <h4 className="font-medium text-sm">Driver Documents</h4>
          
          <div className="space-y-2">
            <Label htmlFor={`license-upload-${index}`}>Driver's License</Label>
            <div className="flex gap-2">
              <Input
                id={`license-upload-${index}`}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => e.target.files?.[0] && handleFileUpload('license_file_url', e.target.files[0])}
                disabled={uploading.license_file_url}
              />
              {driver.license_file_url && (
                <span className="text-sm text-green-600 flex items-center">✓</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`medical-upload-${index}`}>Medical Card</Label>
            <div className="flex gap-2">
              <Input
                id={`medical-upload-${index}`}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => e.target.files?.[0] && handleFileUpload('medical_card_url', e.target.files[0])}
                disabled={uploading.medical_card_url}
              />
              {driver.medical_card_url && (
                <span className="text-sm text-green-600 flex items-center">✓</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`agreement-upload-${index}`}>Signed Agreement</Label>
            <div className="flex gap-2">
              <Input
                id={`agreement-upload-${index}`}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => e.target.files?.[0] && handleFileUpload('signed_agreement_url', e.target.files[0])}
                disabled={uploading.signed_agreement_url}
              />
              {driver.signed_agreement_url && (
                <span className="text-sm text-green-600 flex items-center">✓</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};