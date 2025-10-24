import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TruckIcon, Users, MapPin, ClipboardList } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface DispatchStats {
  activeLoads: number;
  availableDrivers: number;
  inTransit: number;
  pendingWIP: number;
}

interface Driver {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  status: string;
  current_location_lat: number | null;
  current_location_lng: number | null;
  last_location_update: string | null;
}

interface Load {
  id: string;
  load_number: string;
  pickup_city: string;
  pickup_state: string;
  delivery_city: string;
  delivery_state: string;
  status: string;
  driver_id: string | null;
  drivers?: {
    first_name: string;
    last_name: string;
  };
}

export default function DispatchDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DispatchStats>({
    activeLoads: 0,
    availableDrivers: 0,
    inTransit: 0,
    pendingWIP: 0,
  });
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [activeLoads, setActiveLoads] = useState<Load[]>([]);

  useEffect(() => {
    fetchDispatchData();
  }, []);

  const fetchDispatchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.company_id) return;

      const [loadsResult, driversResult, wipResult] = await Promise.all([
        supabase
          .from('loads')
          .select(`
            *,
            drivers(first_name, last_name)
          `)
          .eq('company_id', profile.company_id)
          .in('status', ['assigned', 'in_transit', 'pending'])
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('drivers')
          .select('*')
          .eq('company_id', profile.company_id)
          .order('last_location_update', { ascending: false }),
        supabase
          .from('wip_assignments')
          .select('id', { count: 'exact' })
          .eq('company_id', profile.company_id)
          .eq('status', 'pending')
      ]);

      const inTransitCount = loadsResult.data?.filter(l => l.status === 'in_transit').length || 0;
      const availableDriversCount = driversResult.data?.filter(d => d.status === 'available').length || 0;

      setStats({
        activeLoads: loadsResult.data?.length || 0,
        availableDrivers: availableDriversCount,
        inTransit: inTransitCount,
        pendingWIP: wipResult.count || 0,
      });

      setDrivers(driversResult.data || []);
      setActiveLoads(loadsResult.data || []);
    } catch (error) {
      console.error('Error fetching dispatch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: 'Active Loads', value: stats.activeLoads, icon: TruckIcon, color: 'text-blue-600' },
    { title: 'Available Drivers', value: stats.availableDrivers, icon: Users, color: 'text-green-600' },
    { title: 'In Transit', value: stats.inTransit, icon: MapPin, color: 'text-orange-600' },
    { title: 'Pending WIP', value: stats.pendingWIP, icon: ClipboardList, color: 'text-purple-600' },
  ];

  const getTimeSinceUpdate = (timestamp: string | null) => {
    if (!timestamp) return 'Never';
    const minutes = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dispatch Dashboard</h1>
          <p className="text-muted-foreground">Monitor active loads and driver locations</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Active Loads</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Load #</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeLoads.map((load) => (
                    <TableRow key={load.id}>
                      <TableCell className="font-medium">{load.load_number}</TableCell>
                      <TableCell>
                        {load.drivers ? `${load.drivers.first_name} ${load.drivers.last_name}` : 'Unassigned'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={load.status === 'in_transit' ? 'default' : 'secondary'}>
                          {load.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Driver Locations</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Driver</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Last Update</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drivers.slice(0, 10).map((driver) => (
                    <TableRow key={driver.id}>
                      <TableCell className="font-medium">
                        {driver.first_name} {driver.last_name}
                      </TableCell>
                      <TableCell>
                        {driver.current_location_lat && driver.current_location_lng
                          ? `${driver.current_location_lat.toFixed(4)}, ${driver.current_location_lng.toFixed(4)}`
                          : 'No location'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {getTimeSinceUpdate(driver.last_location_update)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
