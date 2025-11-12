import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, UserX, UserCheck, Download, Eye, Upload, Edit, FileText, Calendar, MapPin, Phone, Building2 } from 'lucide-react';
import { InviteDriverDialog } from './InviteDriverDialog';
import { format } from 'date-fns';

interface CarrierDetailViewProps {
  carrierId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: () => void;
}

export const CarrierDetailView = ({ carrierId, open, onOpenChange, onEdit }: CarrierDetailViewProps) => {
  const [loading, setLoading] = useState(true);
  const [carrier, setCarrier] = useState<any>(null);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (open && carrierId) {
      fetchCarrierDetails();
    }
  }, [open, carrierId]);

  const fetchCarrierDetails = async () => {
    try {
      setLoading(true);

      // Fetch carrier info
      const { data: carrierData, error: carrierError } = await supabase
        .from('carriers')
        .select('*')
        .eq('id', carrierId)
        .single();

      if (carrierError) throw carrierError;
      setCarrier(carrierData);

      // Fetch drivers
      const { data: driversData, error: driversError } = await supabase
        .from('drivers')
        .select('*')
        .eq('carrier_id', carrierId)
        .order('created_at', { ascending: false });

      if (driversError) throw driversError;
      setDrivers(driversData || []);

      // Fetch attachments
      const { data: attachmentsData, error: attachmentsError } = await supabase
        .from('carrier_attachments')
        .select('*')
        .eq('carrier_id', carrierId)
        .order('uploaded_at', { ascending: false });

      if (attachmentsError) throw attachmentsError;
      setAttachments(attachmentsData || []);

    } catch (error: any) {
      console.error('Error fetching carrier details:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePortalAccess = async (driverId: string, currentAccess: boolean) => {
    try {
      const { error } = await supabase
        .from('drivers')
        .update({
          portal_access_enabled: !currentAccess,
          portal_access_revoked_at: !currentAccess ? null : new Date().toISOString()
        })
        .eq('id', driverId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Portal access ${!currentAccess ? 'enabled' : 'disabled'} for driver`
      });

      fetchCarrierDetails();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'w9': 'W9 Form',
      'insurance': 'Certificate of Insurance',
      'mc_authority': 'MC Authority',
      'signed_agreement': 'Signed Agreement',
      'onboarding_summary': 'Onboarding Summary',
      'other': 'Other Document'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!carrier) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{carrier.name}</DialogTitle>
          <div className="flex gap-2 mt-2">
            <Badge variant={carrier.contract_signed ? "default" : "secondary"}>
              {carrier.contract_signed ? "Contract Signed" : "Draft"}
            </Badge>
            <Badge variant="outline">{carrier.sale_stage}</Badge>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="drivers">
              Drivers ({drivers.length})
            </TabsTrigger>
            <TabsTrigger value="documents">
              Documents ({attachments.length})
            </TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Carrier Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">MC Number</p>
                  <p className="font-medium">{carrier.mc_number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">DOT Number</p>
                  <p className="font-medium">{carrier.dot_number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Contact Name</p>
                  <p className="font-medium">{carrier.contact_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{carrier.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {carrier.phone || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Insurance Expiry</p>
                  <p className="font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {carrier.insurance_expiry ? format(new Date(carrier.insurance_expiry), 'MMM dd, yyyy') : 'N/A'}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {carrier.address || 'N/A'}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Preferred Routes</p>
                  <p className="font-medium">{carrier.preferred_routes || 'N/A'}</p>
                </div>
                {carrier.notes && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Notes</p>
                    <p className="font-medium">{carrier.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Carrier
              </Button>
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Generate PDF Summary
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="drivers" className="space-y-4">
            {drivers.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <p className="text-muted-foreground mb-4">No drivers added yet</p>
                  <Button onClick={onEdit}>Add Driver via Onboarding</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {drivers.map((driver) => (
                  <Card key={driver.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-semibold">{driver.first_name} {driver.last_name}</h4>
                          <Badge variant={driver.status === 'available' ? 'default' : 'secondary'}>
                            {driver.status}
                          </Badge>
                          {driver.portal_access_enabled && (
                            <Badge variant="outline" className="bg-green-500/10">
                              Portal Access
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-2 text-sm text-muted-foreground">
                          <p>📞 {driver.phone || 'N/A'}</p>
                          <p>📧 {driver.email || 'N/A'}</p>
                          <p>🪪 {driver.license_number || 'N/A'}</p>
                          <p>🚛 CDL {driver.cdl_class || 'N/A'}</p>
                          {driver.experience_years && (
                            <p>⏱️ {driver.experience_years} years experience</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <InviteDriverDialog
                          driverId={driver.id}
                          driverName={`${driver.first_name} ${driver.last_name}`}
                          driverEmail={driver.email}
                          onSuccess={fetchCarrierDetails}
                        />
                        <Button
                          size="sm"
                          variant={driver.portal_access_enabled ? "destructive" : "default"}
                          onClick={() => togglePortalAccess(driver.id, driver.portal_access_enabled)}
                        >
                          {driver.portal_access_enabled ? (
                            <>
                              <UserX className="h-4 w-4 mr-2" />
                              Disable Portal
                            </>
                          ) : (
                            <>
                              <UserCheck className="h-4 w-4 mr-2" />
                              Enable Portal
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <Button variant="outline" className="w-full" onClick={onEdit}>
                  Add Driver via Onboarding
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            {attachments.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <p className="text-muted-foreground mb-4">No documents uploaded yet</p>
                  <Button>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Documents
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {attachments.map((doc) => (
                  <Card key={doc.id}>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {getDocumentTypeLabel(doc.attachment_type)}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {doc.file_name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-xs text-muted-foreground">
                        Uploaded {format(new Date(doc.uploaded_at), 'MMM dd, yyyy')}
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" asChild>
                          <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </a>
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <a href={doc.file_url} download>
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Activity Timeline</CardTitle>
                <CardDescription>Recent changes and events</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Activity tracking coming soon</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
