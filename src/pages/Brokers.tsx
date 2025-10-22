import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Brokers = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [brokers, setBrokers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    fetchBrokers();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchBrokers = async () => {
    try {
      const { data, error } = await supabase
        .from("brokers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBrokers(data || []);
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
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Brokers</h1>
            <p className="text-muted-foreground">Manage your broker relationships</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Broker
          </Button>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Payment Terms</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : brokers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    No brokers found
                  </TableCell>
                </TableRow>
              ) : (
                brokers.map((broker) => (
                  <TableRow key={broker.id}>
                    <TableCell className="font-medium">{broker.name}</TableCell>
                    <TableCell>{broker.company_name || "N/A"}</TableCell>
                    <TableCell>{broker.phone || "N/A"}</TableCell>
                    <TableCell>{broker.email || "N/A"}</TableCell>
                    <TableCell>{broker.payment_terms || "N/A"}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Brokers;
