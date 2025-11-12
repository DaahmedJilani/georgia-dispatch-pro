import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { DriverEntryCard } from './DriverEntryCard';

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

interface DriversStepProps {
  drivers: Driver[];
  companyId: string;
  onChange: (index: number, field: keyof Driver, value: any) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}

export const DriversStep = ({ drivers, companyId, onChange, onAdd, onRemove }: DriversStepProps) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Driver Information</h3>
        <Button onClick={onAdd} variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Driver
        </Button>
      </div>

      <div className="space-y-4">
        {drivers.map((driver, index) => (
          <DriverEntryCard
            key={index}
            driver={driver}
            index={index}
            companyId={companyId}
            onChange={onChange}
            onRemove={onRemove}
            canRemove={drivers.length > 1}
          />
        ))}
      </div>

      {drivers.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No drivers added yet.</p>
          <Button onClick={onAdd} variant="outline" className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Add First Driver
          </Button>
        </div>
      )}
    </div>
  );
};