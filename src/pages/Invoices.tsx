import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, ExternalLink, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CreateInvoiceDialog } from "@/components/invoices/CreateInvoiceDialog";

const Invoices = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string>("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [generatingPaymentLink, setGeneratingPaymentLink] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
    fetchInvoices();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchInvoices = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("user_id", user.id)
        .single();

      if (!profile?.company_id) return;
      setCompanyId(profile.company_id);

      const { data, error } = await supabase
        .from("invoices")
        .select(`
          *,
          loads(load_number, pickup_city, delivery_city),
          brokers(name, company_name)
        `)
        .eq("company_id", profile.company_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
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

  const generatePaymentLink = async (invoice: any) => {
    setGeneratingPaymentLink(invoice.id);
    try {
      const { data, error } = await supabase.functions.invoke('generate-airwallex-payment-link', {
        body: {
          invoiceId: invoice.id,
          amount: invoice.amount,
          invoiceNumber: invoice.invoice_number,
          description: `Invoice ${invoice.invoice_number}`,
        },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Payment link generated successfully",
      });

      fetchInvoices();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setGeneratingPaymentLink(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      draft: "secondary",
      sent: "default",
      paid: "default",
      overdue: "destructive",
    };
    
    const colors: Record<string, string> = {
      draft: "bg-gray-500",
      sent: "bg-blue-500",
      paid: "bg-green-500",
      overdue: "bg-red-500",
    };

    return (
      <Badge variant={variants[status] || "secondary"} className={colors[status]}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Invoices</h1>
            <p className="text-muted-foreground">Manage invoices and payments</p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Invoice
          </Button>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Load</TableHead>
                <TableHead>Broker</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">
                    No invoices found
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                    <TableCell>
                      {invoice.loads ? (
                        <span className="text-sm">
                          {invoice.loads.load_number}
                          <br />
                          <span className="text-muted-foreground text-xs">
                            {invoice.loads.pickup_city} → {invoice.loads.delivery_city}
                          </span>
                        </span>
                      ) : (
                        "N/A"
                      )}
                    </TableCell>
                    <TableCell>
                      {invoice.brokers ? (
                        <>
                          {invoice.brokers.name}
                          {invoice.brokers.company_name && (
                            <div className="text-xs text-muted-foreground">
                              {invoice.brokers.company_name}
                            </div>
                          )}
                        </>
                      ) : (
                        "N/A"
                      )}
                    </TableCell>
                    <TableCell>{new Date(invoice.invoice_date).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(invoice.due_date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">${invoice.amount.toFixed(2)}</TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell>
                      {invoice.airwallex_payment_link ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(invoice.airwallex_payment_link, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          View Link
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => generatePaymentLink(invoice)}
                          disabled={generatingPaymentLink === invoice.id}
                        >
                          <DollarSign className="h-4 w-4 mr-1" />
                          {generatingPaymentLink === invoice.id ? "Generating..." : "Generate Link"}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      <CreateInvoiceDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={fetchInvoices}
        companyId={companyId}
      />
    </DashboardLayout>
  );
};

export default Invoices;