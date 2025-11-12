import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MapPin, FileText, AlertCircle, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ExportButton } from "@/components/shared/ExportButton";

const Drivers = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    fetchDrivers();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchDrivers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("user_id", user.id)
        .single();

      const { data, error } = await supabase
        .from("drivers")
        .select(`
          *,
          carriers (
            name
          )
        `)
        .eq("company_id", profile?.company_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDrivers(data || []);
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
        <Alert className="bg-blue-500/10 border-blue-500">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-600">
            <strong>Note:</strong> To add or edit drivers, please use the Carrier Onboarding form.
            This page is for viewing and monitoring drivers only.
            <Button
              variant="link"
              className="ml-2 p-0 h-auto text-blue-600 underline"
              onClick={() => navigate('/onboarding')}
            >
              Go to Onboarding →
            </Button>
          </AlertDescription>
        </Alert>

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Drivers</h1>
            <p className="text-muted-foreground">View and monitor all drivers across carriers</p>
          </div>
          <div className="flex gap-2">
            <ExportButton onExport={() => {
              const csvContent = [
                ['Name', 'Carrier', 'Phone', 'Email', 'License', 'CDL', 'Status', 'Portal Access'].join(','),
                ...drivers.map(driver => [
                  `"${driver.first_name} ${driver.last_name}"`,
                  `"${driver.carriers?.name || 'N/A'}"`,
                  driver.phone || '',
                  driver.email || '',
                  driver.license_number || '',
                  driver.cdl_class || '',
                  driver.status,
                  driver.portal_access_enabled ? 'Yes' : 'No'
                ].join(','))
              ].join('\n');
              const blob = new Blob([csvContent], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `drivers-${new Date().toISOString().split('T')[0]}.csv`;
              a.click();
            }} label="Export" />
            <Button onClick={() => navigate('/onboarding')}>
              <UserPlus className="mr-2 h-4 w-4" />
              Use Carrier Onboarding
            </Button>
          </div>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Carrier</TableHead>
                <TableHead>License / CDL</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Portal Access</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : drivers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    No drivers found
                  </TableCell>
                </TableRow>
              ) : (
                drivers.map((driver) => (
                  <TableRow key={driver.id}>
                    <TableCell className="font-medium">
                      {driver.first_name} {driver.last_name}
                    </TableCell>
                    <TableCell>{driver.carriers?.name || "N/A"}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{driver.license_number || 'N/A'}</p>
                        <p className="text-muted-foreground">CDL {driver.cdl_class || 'N/A'}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{driver.phone || 'N/A'}</p>
                        <p className="text-muted-foreground">{driver.email || 'N/A'}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={driver.status === 'available' ? 'default' : 'secondary'}>
                        {driver.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {driver.portal_access_enabled ? (
                        <Badge variant="outline" className="bg-green-500/10">
                          Enabled
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-500/10">
                          Disabled
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/fleet-map?driver_id=${driver.id}`)}
                          title="View on map"
                        >
                          <MapPin className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/documents?driver_id=${driver.id}`)}
                          title="View documents"
                        >
                          <FileText className="h-4 w-4" />
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

export default Drivers;
