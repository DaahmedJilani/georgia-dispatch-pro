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
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, Truck, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CreateCarrierDialog } from "@/components/carriers/CreateCarrierDialog";
import { EditCarrierDialog } from "@/components/carriers/EditCarrierDialog";
import { ContractActivationDialog } from "@/components/sales/ContractActivationDialog";
import { CarrierDetailView } from "@/components/carriers/CarrierDetailView";
import { BulkImportDialog } from "@/components/carriers/BulkImportDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

const Carriers = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [carriers, setCarriers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [carrierToDelete, setCarrierToDelete] = useState<string | null>(null);
  const [carrierToEdit, setCarrierToEdit] = useState<any>(null);
  const [expandedCarriers, setExpandedCarriers] = useState<Set<string>>(new Set());
  const [carrierDrivers, setCarrierDrivers] = useState<Record<string, any[]>>({});
  const [loadingDrivers, setLoadingDrivers] = useState<Set<string>>(new Set());
  const [showDetailView, setShowDetailView] = useState(false);
  const [detailCarrierId, setDetailCarrierId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
    fetchCarriers();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchCarriers = async () => {
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
        .from("carriers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCarriers(data || []);
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

  const toggleCarrierExpanded = async (carrierId: string) => {
    const newExpanded = new Set(expandedCarriers);
    
    if (expandedCarriers.has(carrierId)) {
      newExpanded.delete(carrierId);
      setExpandedCarriers(newExpanded);
    } else {
      newExpanded.add(carrierId);
      setExpandedCarriers(newExpanded);
      
      if (!carrierDrivers[carrierId]) {
        await fetchCarrierDrivers(carrierId);
      }
    }
  };

  const fetchCarrierDrivers = async (carrierId: string) => {
    setLoadingDrivers(prev => new Set(prev).add(carrierId));
    
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('carrier_id', carrierId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setCarrierDrivers(prev => ({
        ...prev,
        [carrierId]: data || []
      }));
    } catch (error: any) {
      console.error('Error fetching drivers:', error);
      toast({
        title: "Error",
        description: "Failed to load drivers",
        variant: "destructive"
      });
    } finally {
      setLoadingDrivers(prev => {
        const newSet = new Set(prev);
        newSet.delete(carrierId);
        return newSet;
      });
    }
  };

  const handleDelete = async () => {
    if (!carrierToDelete) return;

    try {
      const { error } = await supabase
        .from("carriers")
        .delete()
        .eq("id", carrierToDelete);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Carrier deleted successfully",
      });

      fetchCarriers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setCarrierToDelete(null);
    }
  };

  const openCarrierDetail = (carrierId: string) => {
    setDetailCarrierId(carrierId);
    setShowDetailView(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Carriers</h1>
            <p className="text-muted-foreground">Manage carrier companies and their drivers</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/onboarding')} variant="default">
              <Plus className="mr-2 h-4 w-4" />
              Start Onboarding
            </Button>
            <BulkImportDialog onSuccess={fetchCarriers} />
            <Button onClick={() => setCreateDialogOpen(true)} variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Quick Add Carrier
            </Button>
          </div>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Name / Status</TableHead>
                <TableHead>MC / DOT</TableHead>
                <TableHead>Drivers</TableHead>
                <TableHead>Contact</TableHead>
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
              ) : carriers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    No carriers found
                  </TableCell>
                </TableRow>
              ) : (
                carriers.map((carrier) => {
                  const isExpanded = expandedCarriers.has(carrier.id);
                  const drivers = carrierDrivers[carrier.id] || [];
                  const isLoadingDrivers = loadingDrivers.has(carrier.id);

                  return (
                    <>
                      <TableRow key={carrier.id}>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleCarrierExpanded(carrier.id)}
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div 
                            className="cursor-pointer hover:underline"
                            onClick={() => openCarrierDetail(carrier.id)}
                          >
                            <p className="font-medium">{carrier.name}</p>
                            <div className="flex gap-1 mt-1">
                              {carrier.contract_status === 'signed' && (
                                <Badge variant="default" className="text-xs bg-green-600">Contract Signed</Badge>
                              )}
                              {carrier.contract_status === 'sent' && (
                                <Badge variant="secondary" className="text-xs">Pending Signature</Badge>
                              )}
                              {carrier.sale_stage && (
                                <Badge variant="outline" className="text-xs">{carrier.sale_stage}</Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>MC: {carrier.mc_number || 'N/A'}</p>
                            <p className="text-muted-foreground">DOT: {carrier.dot_number || 'N/A'}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="gap-1">
                            <Truck className="h-3 w-3" />
                            {drivers.length} driver{drivers.length !== 1 ? 's' : ''}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{carrier.contact_name || 'N/A'}</p>
                            <p className="text-muted-foreground">{carrier.email || carrier.phone || 'N/A'}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <ContractActivationDialog
                              carrier={{
                                id: carrier.id,
                                name: carrier.name,
                                email: carrier.email || '',
                              }}
                              onSuccess={fetchCarriers}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => navigate(`/onboarding?carrier_id=${carrier.id}`)}
                              title="Edit via Onboarding"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setCarrierToDelete(carrier.id);
                                setDeleteDialogOpen(true);
                              }}
                              title="Delete Carrier"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      
                      {isExpanded && (
                        <TableRow>
                          <TableCell colSpan={6} className="bg-muted/30">
                            <div className="p-4">
                              {isLoadingDrivers ? (
                                <div className="flex items-center justify-center py-4">
                                  <Loader2 className="h-6 w-6 animate-spin" />
                                </div>
                              ) : drivers.length === 0 ? (
                                <div className="text-center py-4">
                                  <p className="text-muted-foreground mb-3">No drivers added yet</p>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => navigate(`/onboarding?carrier_id=${carrier.id}`)}
                                  >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Driver via Onboarding
                                  </Button>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-semibold text-sm">Drivers</h4>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => navigate(`/onboarding?carrier_id=${carrier.id}`)}
                                    >
                                      <Plus className="h-3 w-3 mr-2" />
                                      Add Driver
                                    </Button>
                                  </div>
                                  {drivers.map((driver) => (
                                    <Card key={driver.id} className="p-3">
                                      <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2">
                                            <p className="font-medium text-sm">
                                              {driver.first_name} {driver.last_name}
                                            </p>
                                            <Badge variant={driver.status === 'available' ? 'default' : 'secondary'} className="text-xs">
                                              {driver.status}
                                            </Badge>
                                            {driver.portal_access_enabled && (
                                              <Badge variant="outline" className="text-xs bg-green-500/10">
                                                Portal Access
                                              </Badge>
                                            )}
                                          </div>
                                          <div className="grid grid-cols-2 gap-x-4 mt-1 text-xs text-muted-foreground">
                                            <p>📞 {driver.phone || 'N/A'}</p>
                                            <p>🪪 {driver.license_number || 'N/A'}</p>
                                            <p>📧 {driver.email || 'N/A'}</p>
                                            <p>🚛 CDL {driver.cdl_class || 'N/A'}</p>
                                          </div>
                                        </div>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => openCarrierDetail(carrier.id)}
                                        >
                                          View Details
                                        </Button>
                                      </div>
                                    </Card>
                                  ))}
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      <CreateCarrierDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={fetchCarriers}
        companyId={companyId}
      />

      {carrierToEdit && (
        <EditCarrierDialog
          carrier={carrierToEdit}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSuccess={fetchCarriers}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Carrier</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this carrier and all associated drivers? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {detailCarrierId && (
        <CarrierDetailView
          carrierId={detailCarrierId}
          open={showDetailView}
          onOpenChange={setShowDetailView}
          onEdit={() => {
            setShowDetailView(false);
            navigate(`/onboarding?carrier_id=${detailCarrierId}`);
          }}
        />
      )}
    </DashboardLayout>
  );
};

export default Carriers;
