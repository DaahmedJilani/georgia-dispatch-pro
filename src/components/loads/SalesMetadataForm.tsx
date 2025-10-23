import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

interface SalesMetadataFormProps {
  salesPercentage: number;
  factoring: boolean;
  onSalesPercentageChange: (value: number) => void;
  onFactoringChange: (value: boolean) => void;
}

export function SalesMetadataForm({
  salesPercentage,
  factoring,
  onSalesPercentageChange,
  onFactoringChange,
}: SalesMetadataFormProps) {
  const handlePercentageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (isNaN(value)) {
      onSalesPercentageChange(0);
    } else if (value < 0) {
      onSalesPercentageChange(0);
    } else if (value > 100) {
      onSalesPercentageChange(100);
    } else {
      onSalesPercentageChange(value);
    }
  };

  return (
    <div className="space-y-4 border-t pt-4 mt-4">
      <h3 className="text-sm font-semibold">Sales Information</h3>
      
      <div className="grid gap-2">
        <Label htmlFor="salesPercentage">Sales Commission (%)</Label>
        <Input
          id="salesPercentage"
          type="number"
          min="0"
          max="100"
          step="0.1"
          value={salesPercentage}
          onChange={handlePercentageChange}
          placeholder="Enter commission percentage (0-100)"
        />
        <p className="text-xs text-muted-foreground">
          Commission percentage for this sale (0-100%)
        </p>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="factoring"
          checked={factoring}
          onCheckedChange={(checked) => onFactoringChange(checked === true)}
        />
        <Label
          htmlFor="factoring"
          className="text-sm font-normal cursor-pointer"
        >
          Use Factoring
        </Label>
      </div>
      <p className="text-xs text-muted-foreground">
        Enable if this load will use factoring services
      </p>
    </div>
  );
}
