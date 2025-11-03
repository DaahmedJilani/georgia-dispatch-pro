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
import { CreateBrokerDialog } from "@/components/brokers/CreateBrokerDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useUserRole } from "@/hooks/useUserRole";

const Brokers = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { role, isMasterAdmin } = useUserRole();
  const [brokers, setBrokers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [brokerToDelete, setBrokerToDelete] = useState<{ id: string; name: string } | null>(null);

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("user_id", user.id)
        .single();

      if (profile?.company_id) {
        setCompanyId(profile.company_id);
      }

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

  const handleDelete = async () => {
    if (!brokerToDelete) return;

    try {
      const { error } = await supabase
        .from("brokers")
        .delete()
        .eq("id", brokerToDelete.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${brokerToDelete.name} has been deleted`,
      });

      setDeleteDialogOpen(false);
      setBrokerToDelete(null);
      fetchBrokers();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete broker",
      });
    }
  };

  const canDelete = role === 'admin' || isMasterAdmin;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Brokers</h1>
            <p className="text-muted-foreground">Manage your broker relationships</p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
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
                        {canDelete && (
                          <Button variant="ghost" size="icon">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                              setBrokerToDelete({ id: broker.id, name: broker.name });
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      <CreateBrokerDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={fetchBrokers}
        companyId={companyId}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Broker?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {brokerToDelete?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Brokers;
