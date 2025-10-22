import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Upload } from "lucide-react";

interface CreateLoadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  drivers: any[];
  brokers: any[];
  carriers: any[];
  companyId: string;
}

const CreateLoadDialog = ({
  open,
  onOpenChange,
  onSuccess,
  drivers,
  brokers,
  carriers,
  companyId,
}: CreateLoadDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    load_number: `LOAD-${Date.now()}`,
    pickup_location: "",
    pickup_city: "",
    pickup_state: "",
    pickup_date: "",
    pickup_notes: "",
    delivery_location: "",
    delivery_city: "",
    delivery_state: "",
    delivery_date: "",
    delivery_notes: "",
    commodity: "",
    weight: "",
    distance: "",
    rate: "",
    driver_id: "",
    broker_id: "",
    carrier_id: "",
    reference_number: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("loads").insert({
        ...formData,
        company_id: companyId,
        created_by: user.id,
        status: "pending",
        weight: formData.weight ? parseFloat(formData.weight) : null,
        distance: formData.distance ? parseFloat(formData.distance) : null,
        rate: formData.rate ? parseFloat(formData.rate) : null,
        driver_id: formData.driver_id || null,
        broker_id: formData.broker_id || null,
        carrier_id: formData.carrier_id || null,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Load created successfully",
      });

      onSuccess();
      onOpenChange(false);
      // Reset form
      setFormData({
        load_number: `LOAD-${Date.now()}`,
        pickup_location: "",
        pickup_city: "",
        pickup_state: "",
        pickup_date: "",
        pickup_notes: "",
        delivery_location: "",
        delivery_city: "",
        delivery_state: "",
        delivery_date: "",
        delivery_notes: "",
        commodity: "",
        weight: "",
        distance: "",
        rate: "",
        driver_id: "",
        broker_id: "",
        carrier_id: "",
        reference_number: "",
        notes: "",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create load",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Load</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="load_number">Load Number *</Label>
              <Input
                id="load_number"
                value={formData.load_number}
                onChange={(e) => setFormData({ ...formData, load_number: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reference_number">Reference Number</Label>
              <Input
                id="reference_number"
                value={formData.reference_number}
                onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
              />
            </div>
          </div>

          {/* Pickup Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Pickup Information</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="pickup_location">Pickup Address *</Label>
                <Input
                  id="pickup_location"
                  value={formData.pickup_location}
                  onChange={(e) => setFormData({ ...formData, pickup_location: e.target.value })}
                  placeholder="123 Main St, City, State ZIP"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pickup_city">City *</Label>
                <Input
                  id="pickup_city"
                  value={formData.pickup_city}
                  onChange={(e) => setFormData({ ...formData, pickup_city: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pickup_state">State *</Label>
                <Input
                  id="pickup_state"
                  value={formData.pickup_state}
                  onChange={(e) => setFormData({ ...formData, pickup_state: e.target.value })}
                  placeholder="GA"
                  maxLength={2}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pickup_date">Pickup Date</Label>
                <Input
                  id="pickup_date"
                  type="datetime-local"
                  value={formData.pickup_date}
                  onChange={(e) => setFormData({ ...formData, pickup_date: e.target.value })}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="pickup_notes">Pickup Notes</Label>
                <Textarea
                  id="pickup_notes"
                  value={formData.pickup_notes}
                  onChange={(e) => setFormData({ ...formData, pickup_notes: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Delivery Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Delivery Information</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="delivery_location">Delivery Address *</Label>
                <Input
                  id="delivery_location"
                  value={formData.delivery_location}
                  onChange={(e) => setFormData({ ...formData, delivery_location: e.target.value })}
                  placeholder="456 Oak Ave, City, State ZIP"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="delivery_city">City *</Label>
                <Input
                  id="delivery_city"
                  value={formData.delivery_city}
                  onChange={(e) => setFormData({ ...formData, delivery_city: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="delivery_state">State *</Label>
                <Input
                  id="delivery_state"
                  value={formData.delivery_state}
                  onChange={(e) => setFormData({ ...formData, delivery_state: e.target.value })}
                  placeholder="FL"
                  maxLength={2}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="delivery_date">Delivery Date</Label>
                <Input
                  id="delivery_date"
                  type="datetime-local"
                  value={formData.delivery_date}
                  onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="delivery_notes">Delivery Notes</Label>
                <Textarea
                  id="delivery_notes"
                  value={formData.delivery_notes}
                  onChange={(e) => setFormData({ ...formData, delivery_notes: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Load Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Load Details</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="commodity">Commodity</Label>
                <Input
                  id="commodity"
                  value={formData.commodity}
                  onChange={(e) => setFormData({ ...formData, commodity: e.target.value })}
                  placeholder="General Freight"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (lbs)</Label>
                <Input
                  id="weight"
                  type="number"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="distance">Distance (miles)</Label>
                <Input
                  id="distance"
                  type="number"
                  value={formData.distance}
                  onChange={(e) => setFormData({ ...formData, distance: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rate">Rate ($)</Label>
                <Input
                  id="rate"
                  type="number"
                  step="0.01"
                  value={formData.rate}
                  onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Assignments */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Assignments</h3>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="driver_id">Driver</Label>
                <Select
                  value={formData.driver_id}
                  onValueChange={(value) => setFormData({ ...formData, driver_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select driver" />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers.map((driver) => (
                      <SelectItem key={driver.id} value={driver.id}>
                        {driver.first_name} {driver.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="broker_id">Broker</Label>
                <Select
                  value={formData.broker_id}
                  onValueChange={(value) => setFormData({ ...formData, broker_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select broker" />
                  </SelectTrigger>
                  <SelectContent>
                    {brokers.map((broker) => (
                      <SelectItem key={broker.id} value={broker.id}>
                        {broker.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="carrier_id">Carrier</Label>
                <Select
                  value={formData.carrier_id}
                  onValueChange={(value) => setFormData({ ...formData, carrier_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select carrier" />
                  </SelectTrigger>
                  <SelectContent>
                    {carriers.map((carrier) => (
                      <SelectItem key={carrier.id} value={carrier.id}>
                        {carrier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Load
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateLoadDialog;
