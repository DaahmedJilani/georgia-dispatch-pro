import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CreateCarrierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  companyId: string;
}

export const CreateCarrierDialog = ({ open, onOpenChange, onSuccess, companyId }: CreateCarrierDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    mc_number: "",
    dot_number: "",
    email: "",
    phone: "",
    address: "",
    insurance_expiry: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from("carriers").insert([
        {
          ...formData,
          company_id: companyId,
          insurance_expiry: formData.insurance_expiry || null,
        },
      ]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Carrier created successfully",
      });

      setFormData({
        name: "",
        mc_number: "",
        dot_number: "",
        email: "",
        phone: "",
        address: "",
        insurance_expiry: "",
        notes: "",
      });
      
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Carrier</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Carrier Name *</Label>
            <Input
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="mc_number">MC Number</Label>
              <Input
                id="mc_number"
                value={formData.mc_number}
                onChange={(e) => setFormData({ ...formData, mc_number: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="dot_number">DOT Number</Label>
              <Input
                id="dot_number"
                value={formData.dot_number}
                onChange={(e) => setFormData({ ...formData, dot_number: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="insurance_expiry">Insurance Expiry Date</Label>
            <Input
              id="insurance_expiry"
              type="date"
              value={formData.insurance_expiry}
              onChange={(e) => setFormData({ ...formData, insurance_expiry: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Carrier"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};