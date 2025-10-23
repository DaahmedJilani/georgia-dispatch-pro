import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, MapPin, Calendar, Package, DollarSign, FileText, Truck, User, Building2, Upload, Download, Eye, Sparkles } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { AIAssistDialog } from "@/components/ai/AIAssistDialog";
import { LoadMapComponent } from "@/components/map/LoadMapComponent";

interface LoadDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loadId: string | null;
  onUpdate: () => void;
}

const LoadDetailsDialog = ({ open, onOpenChange, loadId, onUpdate }: LoadDetailsDialogProps) => {
  const { toast } = useToast();
  const [load, setLoad] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);

  useEffect(() => {
    if (loadId && open) {
      fetchLoadDetails();
      fetchDocuments();
    }
  }, [loadId, open]);

  const fetchLoadDetails = async () => {
    if (!loadId) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("loads")
        .select("*, drivers(first_name, last_name), brokers(name), carriers(name)")
        .eq("id", loadId)
        .single();

      if (error) throw error;
      setLoad(data);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load details",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    if (!loadId) return;

    try {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("load_id", loadId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error: any) {
      console.error("Failed to fetch documents:", error);
    }
  };

  const updateLoadStatus = async (newStatus: string) => {
    if (!loadId) return;

    try {
      const validStatuses = ["pending", "assigned", "picked", "in_transit", "delivered", "cancelled"];
      if (!validStatuses.includes(newStatus)) {
        throw new Error("Invalid status");
      }

      const { error } = await supabase
        .from("loads")
        .update({ status: newStatus as any })
        .eq("id", loadId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Load status changed to ${newStatus.replace("_", " ")}`,
      });

      fetchLoadDetails();
      onUpdate();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update status",
      });
    }
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !loadId) return;

    setUploadingDoc(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("user_id", user.id)
        .single();

      if (!profile?.company_id) throw new Error("Company not found");

      // Upload to Supabase Storage (bucket needs to be created)
      const fileExt = file.name.split('.').pop();
      const fileName = `${loadId}/${Date.now()}.${fileExt}`;
      
      // For now, just save the document record without storage
      // Storage bucket setup needed separately
      const { error: docError } = await supabase.from("documents").insert({
        load_id: loadId,
        company_id: profile.company_id,
        file_name: file.name,
        file_path: fileName,
        file_size: file.size,
        document_type: "load_document",
        uploaded_by: user.id,
      });

      if (docError) throw docError;

      toast({
        title: "Document Uploaded",
        description: "Document added successfully",
      });

      fetchDocuments();
      e.target.value = "";
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to upload document",
      });
    } finally {
      setUploadingDoc(false);
    }
  };

  if (loading || !load) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Load {load.load_number}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="map">Map</TabsTrigger>
            <TabsTrigger value="documents">Documents ({documents.length})</TabsTrigger>
            <TabsTrigger value="status">Status & Updates</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6 mt-6">
            {/* Status Badge */}
            <div className="flex items-center gap-3">
              <span className={`status-badge status-${load.status}`}>
                {load.status.replace("_", " ").toUpperCase()}
              </span>
              {load.reference_number && (
                <span className="text-sm text-muted-foreground">
                  Ref: {load.reference_number}
                </span>
              )}
            </div>

            {/* Route */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-green-600 mt-1" />
                  <div>
                    <h4 className="font-semibold mb-1">Pickup</h4>
                    <p className="text-sm">{load.pickup_location}</p>
                    <p className="text-sm text-muted-foreground">
                      {load.pickup_city}, {load.pickup_state}
                    </p>
                    {load.pickup_date && (
                      <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        {new Date(load.pickup_date).toLocaleString()}
                      </div>
                    )}
                    {load.pickup_notes && (
                      <p className="text-sm mt-2 p-2 bg-muted rounded">{load.pickup_notes}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-red-600 mt-1" />
                  <div>
                    <h4 className="font-semibold mb-1">Delivery</h4>
                    <p className="text-sm">{load.delivery_location}</p>
                    <p className="text-sm text-muted-foreground">
                      {load.delivery_city}, {load.delivery_state}
                    </p>
                    {load.delivery_date && (
                      <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        {new Date(load.delivery_date).toLocaleString()}
                      </div>
                    )}
                    {load.delivery_notes && (
                      <p className="text-sm mt-2 p-2 bg-muted rounded">{load.delivery_notes}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Load Info */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {load.commodity && (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Package className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Commodity</p>
                    <p className="font-medium">{load.commodity}</p>
                  </div>
                </div>
              )}
              {load.weight && (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Package className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Weight</p>
                    <p className="font-medium">{load.weight} lbs</p>
                  </div>
                </div>
              )}
              {load.distance && (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Distance</p>
                    <p className="font-medium">{load.distance} miles</p>
                  </div>
                </div>
              )}
              {load.rate && (
                <div className="flex items-center gap-2 p-3 bg-green-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-xs text-green-700">Rate</p>
                    <p className="font-semibold text-green-800">${load.rate.toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Assignments */}
            <div className="space-y-3">
              <h4 className="font-semibold">Assignments</h4>
              <div className="grid sm:grid-cols-3 gap-4">
                {load.drivers && (
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <Truck className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Driver</p>
                      <p className="font-medium">
                        {load.drivers.first_name} {load.drivers.last_name}
                      </p>
                    </div>
                  </div>
                )}
                {load.brokers && (
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <User className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Broker</p>
                      <p className="font-medium">{load.brokers.name}</p>
                    </div>
                  </div>
                )}
                {load.carriers && (
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <Building2 className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Carrier</p>
                      <p className="font-medium">{load.carriers.name}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {load.notes && (
              <div className="space-y-2">
                <h4 className="font-semibold">Notes</h4>
                <p className="text-sm p-3 bg-muted rounded-lg">{load.notes}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="map" className="mt-6">
            <LoadMapComponent
              loadId={load.id}
              driverName={load.drivers ? `${load.drivers.first_name} ${load.drivers.last_name}` : undefined}
              driverLat={load.drivers?.current_location_lat ? parseFloat(load.drivers.current_location_lat) : undefined}
              driverLng={load.drivers?.current_location_lng ? parseFloat(load.drivers.current_location_lng) : undefined}
            />
          </TabsContent>

          <TabsContent value="documents" className="space-y-4 mt-6">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Load Documents</h4>
              <div>
                <Input
                  type="file"
                  id="doc-upload"
                  className="hidden"
                  onChange={handleDocumentUpload}
                  disabled={uploadingDoc}
                />
                <Button
                  size="sm"
                  onClick={() => document.getElementById("doc-upload")?.click()}
                  disabled={uploadingDoc}
                >
                  {uploadingDoc ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Document
                    </>
                  )}
                </Button>
              </div>
            </div>

            {documents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No documents uploaded yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted transition-smooth"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{doc.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(doc.created_at).toLocaleDateString()} •{" "}
                          {doc.file_size ? `${(doc.file_size / 1024).toFixed(1)} KB` : "Unknown size"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="status" className="space-y-6 mt-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Update Load Status</Label>
                <Select value={load.status} onValueChange={updateLoadStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="picked">Picked Up</SelectItem>
                    <SelectItem value="in_transit">In Transit</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Status Timeline</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <div>
                      <p className="text-sm font-medium">Created</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(load.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {load.status !== "pending" && (
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <div>
                        <p className="text-sm font-medium">Status: {load.status.replace("_", " ")}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(load.updated_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default LoadDetailsDialog;
