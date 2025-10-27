import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserRole } from "@/hooks/useUserRole";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Download, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DocumentUploadDialog } from "@/components/documents/DocumentUploadDialog";
import { PODExtractor } from "@/components/documents/PODExtractor";
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

const Documents = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState("");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<any>(null);
  const [selectedDocForExtraction, setSelectedDocForExtraction] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('all');
  const { role, isMasterAdmin } = useUserRole();

  useEffect(() => {
    checkAuth();
    fetchDocuments();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchDocuments = async () => {
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

      // Filter documents based on role and visibility
      let query = supabase
        .from("documents")
        .select("*")
        .order("created_at", { ascending: false });

      // Apply company filter if not master admin
      if (!isMasterAdmin && profile?.company_id) {
        query = query.eq('company_id', profile.company_id);
      }

      // Apply role-based visibility filtering
      if (!isMasterAdmin && role) {
        if (role === 'sales') {
          // Sales can only see sales docs (MC, W9, COI, NOA, VOID CHECK)
          query = query.in('document_type', ['mc', 'w9', 'coi', 'noa', 'void_check']);
        } else if (role === 'dispatcher') {
          // Dispatcher can see sales docs (read-only) + dispatch docs + driver docs
          query = query.in('document_type', ['mc', 'w9', 'coi', 'noa', 'void_check', 'rc', 'bol', 'pod', 'do', 'invoice', 'license', 'cab_card', 'truck_image']);
        } else if (role === 'treasury') {
          // Treasury can only see invoices
          query = query.eq('document_type', 'invoice');
        } else if (role === 'driver') {
          // Drivers can only see their own driver docs
          const { data: driverData } = await supabase
            .from('drivers')
            .select('id')
            .eq('user_id', user.id)
            .single();
          
          if (driverData) {
            query = query.eq('driver_id', driverData.id).in('document_type', ['license', 'cab_card', 'truck_image']);
          }
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      setDocuments(data || []);
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

  const handleDownload = async (doc: any) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(doc.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!documentToDelete) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([documentToDelete.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from("documents")
        .delete()
        .eq("id", documentToDelete.id);

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "Document deleted successfully",
      });

      fetchDocuments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const salesDocs = documents.filter(d => ['mc', 'w9', 'coi', 'noa', 'void_check'].includes(d.document_type));
  const dispatchDocs = documents.filter(d => ['rc', 'bol', 'pod', 'do', 'invoice'].includes(d.document_type));
  const driverDocs = documents.filter(d => ['license', 'cab_card', 'truck_image'].includes(d.document_type));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Documents</h1>
            <p className="text-muted-foreground">Manage load documents and files</p>
            {role && (
              <Badge className="mt-2">
                {role === 'sales' ? 'Sales Documents Only' :
                 role === 'dispatcher' ? 'Sales & Dispatch Documents' :
                 role === 'treasury' ? 'Invoice Documents Only' :
                 'All Documents'}
              </Badge>
            )}
          </div>
          <Button onClick={() => setUploadDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Upload Document
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            {(isMasterAdmin || role === 'admin') && (
              <TabsTrigger value="all">All Documents</TabsTrigger>
            )}
            {(isMasterAdmin || role === 'sales' || role === 'dispatcher' || role === 'admin') && (
              <TabsTrigger value="sales">Sales Docs</TabsTrigger>
            )}
            {(isMasterAdmin || role === 'dispatcher' || role === 'admin') && (
              <TabsTrigger value="dispatch">Dispatch Docs</TabsTrigger>
            )}
            {(isMasterAdmin || role === 'dispatcher' || role === 'admin') && (
              <TabsTrigger value="driver">Driver Docs</TabsTrigger>
            )}
            {role === 'treasury' && (
              <TabsTrigger value="invoices">Invoices</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="all">
            <Card>
              <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead>Actions</TableHead>
                <TableHead>Extract Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : documents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    No documents found
                  </TableCell>
                </TableRow>
              ) : (
                documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.file_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{doc.document_type}</Badge>
                    </TableCell>
                    <TableCell>{formatFileSize(doc.file_size || 0)}</TableCell>
                    <TableCell>
                      {new Date(doc.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownload(doc)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setDocumentToDelete(doc);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      {doc.document_type === 'pod' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedDocForExtraction(doc)}
                        >
                          Extract Data
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
            </Card>
          </TabsContent>

          <TabsContent value="sales">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesDocs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">No sales documents</TableCell>
                    </TableRow>
                  ) : (
                    salesDocs.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">{doc.file_name}</TableCell>
                        <TableCell><Badge variant="outline">{doc.document_type}</Badge></TableCell>
                        <TableCell>{formatFileSize(doc.file_size || 0)}</TableCell>
                        <TableCell>{new Date(doc.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleDownload(doc)}>
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="dispatch">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dispatchDocs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">No dispatch documents</TableCell>
                    </TableRow>
                  ) : (
                    dispatchDocs.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">{doc.file_name}</TableCell>
                        <TableCell><Badge variant="outline">{doc.document_type}</Badge></TableCell>
                        <TableCell>{formatFileSize(doc.file_size || 0)}</TableCell>
                        <TableCell>{new Date(doc.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleDownload(doc)}>
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="driver">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {driverDocs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">No driver documents</TableCell>
                    </TableRow>
                  ) : (
                    driverDocs.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">{doc.file_name}</TableCell>
                        <TableCell><Badge variant="outline">{doc.document_type}</Badge></TableCell>
                        <TableCell>{formatFileSize(doc.file_size || 0)}</TableCell>
                        <TableCell>{new Date(doc.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleDownload(doc)}>
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="invoices">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File Name</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.filter(d => d.document_type === 'invoice').length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">No invoice documents</TableCell>
                    </TableRow>
                  ) : (
                    documents.filter(d => d.document_type === 'invoice').map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">{doc.file_name}</TableCell>
                        <TableCell>{formatFileSize(doc.file_size || 0)}</TableCell>
                        <TableCell>{new Date(doc.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => handleDownload(doc)}>
                            <Download className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <DocumentUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onSuccess={fetchDocuments}
        companyId={companyId}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedDocForExtraction && (
        <PODExtractor
          documentId={selectedDocForExtraction.id}
          fileUrl={selectedDocForExtraction.file_path}
        />
      )}
    </DashboardLayout>
  );
};

export default Documents;
