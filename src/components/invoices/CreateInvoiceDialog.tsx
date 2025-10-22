import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CreateInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  companyId: string;
  preselectedLoadId?: string;
}

export const CreateInvoiceDialog = ({ open, onOpenChange, onSuccess, companyId, preselectedLoadId }: CreateInvoiceDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loads, setLoads] = useState<any[]>([]);
  const [brokers, setBrokers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    load_id: preselectedLoadId || "",
    broker_id: "",
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: "",
    amount: "",
    notes: "",
  });

  useEffect(() => {
    if (open) {
      fetchLoadsAndBrokers();
      if (preselectedLoadId) {
        setFormData(prev => ({ ...prev, load_id: preselectedLoadId }));
        fetchLoadDetails(preselectedLoadId);
      }
    }
  }, [open, preselectedLoadId]);

  const fetchLoadsAndBrokers = async () => {
    const [loadsRes, brokersRes] = await Promise.all([
      supabase.from("loads").select("*").eq("company_id", companyId).order("created_at", { ascending: false }),
      supabase.from("brokers").select("*").eq("company_id", companyId).order("name"),
    ]);

    if (loadsRes.data) setLoads(loadsRes.data);
    if (brokersRes.data) setBrokers(brokersRes.data);
  };

  const fetchLoadDetails = async (loadId: string) => {
    const { data } = await supabase.from("loads").select("*, brokers(*)").eq("id", loadId).single();
    
    if (data) {
      setFormData(prev => ({
        ...prev,
        broker_id: data.broker_id || "",
        amount: data.rate?.toString() || "",
      }));
    }
  };

  const generateInvoiceNumber = () => {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `INV-${dateStr}-${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const invoiceNumber = generateInvoiceNumber();
      
      const { error } = await supabase.from("invoices").insert([
        {
          ...formData,
          company_id: companyId,
          invoice_number: invoiceNumber,
          load_id: formData.load_id || null,
          broker_id: formData.broker_id || null,
          amount: parseFloat(formData.amount),
          status: "draft",
          created_by: (await supabase.auth.getUser()).data.user?.id,
        },
      ]);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Invoice ${invoiceNumber} created successfully`,
      });

      setFormData({
        load_id: "",
        broker_id: "",
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: "",
        amount: "",
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
          <DialogTitle>Create Invoice</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="load_id">Load (Optional)</Label>
            <Select 
              value={formData.load_id} 
              onValueChange={(value) => {
                setFormData({ ...formData, load_id: value });
                fetchLoadDetails(value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a load..." />
              </SelectTrigger>
              <SelectContent>
                {loads.map((load) => (
                  <SelectItem key={load.id} value={load.id}>
                    {load.load_number} - {load.pickup_city} to {load.delivery_city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="broker_id">Broker/Customer (Optional)</Label>
            <Select value={formData.broker_id} onValueChange={(value) => setFormData({ ...formData, broker_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select a broker..." />
              </SelectTrigger>
              <SelectContent>
                {brokers.map((broker) => (
                  <SelectItem key={broker.id} value={broker.id}>
                    {broker.name} {broker.company_name ? `(${broker.company_name})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="invoice_date">Invoice Date *</Label>
              <Input
                id="invoice_date"
                type="date"
                required
                value={formData.invoice_date}
                onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="due_date">Due Date *</Label>
              <Input
                id="due_date"
                type="date"
                required
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="amount">Amount (USD) *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              required
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
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
              {loading ? "Creating..." : "Create Invoice"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};