import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface CarrierData {
  name: string;
  mc_number: string;
  dot_number: string;
  address: string;
  contact_name: string;
  contact_email: string;
  phone: string;
  insurance_expiry: string;
  preferred_routes: string;
  notes: string;
}

interface CarrierInfoStepProps {
  data: CarrierData;
  onChange: (field: keyof CarrierData, value: string) => void;
}

export const CarrierInfoStep = ({ data, onChange }: CarrierInfoStepProps) => {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Carrier Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="carrier-name">Carrier Name *</Label>
            <Input
              id="carrier-name"
              value={data.name}
              onChange={(e) => onChange('name', e.target.value)}
              placeholder="ABC Logistics"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact-name">Contact Name *</Label>
            <Input
              id="contact-name"
              value={data.contact_name}
              onChange={(e) => onChange('contact_name', e.target.value)}
              placeholder="John Doe"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mc-number">MC Number</Label>
            <Input
              id="mc-number"
              value={data.mc_number}
              onChange={(e) => onChange('mc_number', e.target.value)}
              placeholder="MC12345"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dot-number">DOT Number</Label>
            <Input
              id="dot-number"
              value={data.dot_number}
              onChange={(e) => onChange('dot_number', e.target.value)}
              placeholder="DOT9876"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={data.address}
              onChange={(e) => onChange('address', e.target.value)}
              placeholder="123 Main St, City, State ZIP"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact-email">Contact Email *</Label>
            <Input
              id="contact-email"
              type="email"
              value={data.contact_email}
              onChange={(e) => onChange('contact_email', e.target.value)}
              placeholder="john@abc.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              type="tel"
              value={data.phone}
              onChange={(e) => onChange('phone', e.target.value)}
              placeholder="555-555-5555"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="insurance-expiry">Insurance Expiration Date</Label>
            <Input
              id="insurance-expiry"
              type="date"
              value={data.insurance_expiry}
              onChange={(e) => onChange('insurance_expiry', e.target.value)}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="preferred-routes">Preferred Lanes / Routes</Label>
            <Textarea
              id="preferred-routes"
              value={data.preferred_routes}
              onChange={(e) => onChange('preferred_routes', e.target.value)}
              placeholder="TX, OK, AR - Interstate routes preferred"
              rows={3}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={data.notes}
              onChange={(e) => onChange('notes', e.target.value)}
              placeholder="Hazmat Certified, Team drivers available..."
              rows={3}
            />
          </div>
        </div>
      </div>
    </div>
  );
};