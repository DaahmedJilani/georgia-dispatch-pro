import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TruckIcon, MapPin, DollarSign, Building2, User, Phone, CheckCircle, Navigation } from 'lucide-react';
import { GPSConsentDialog } from '@/components/map/GPSConsentDialog';
import { GPSStatusBadge } from '@/components/map/GPSStatusBadge';
import { Badge } from '@/components/ui/badge';

interface DriverStats {
  myActiveLoads: number;
  myCompletedLoads: number;
  totalEarnings: number;
  pendingPayments: number;
}

interface CompanyInfo {
  companyName: string;
  dispatcherName: string;
  dispatcherPhone: string;
  dispatcherEmail: string;
}

interface CurrentLocation {
  lat: number;
  lng: number;
  timestamp: string;
}

export default function DriverPortal() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DriverStats>({
    myActiveLoads: 0,
    myCompletedLoads: 0,
    totalEarnings: 0,
    pendingPayments: 0,
  });
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    companyName: '',
    dispatcherName: '',
    dispatcherPhone: '',
    dispatcherEmail: '',
  });
  const [currentLocation, setCurrentLocation] = useState<CurrentLocation | null>(null);
  const [driverId, setDriverId] = useState<string | null>(null);
  const [gpsConsent, setGpsConsent] = useState<boolean>(false);

  useEffect(() => {
    fetchDriverData();
  }, []);

  const fetchDriverData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch driver profile with company and dispatcher info
      const { data: driverData } = await supabase
        .from('drivers')
        .select(`
          id, 
          gps_consent,
          current_location_lat,
          current_location_lng,
          last_location_update,
          company_id,
          dispatcher_id,
          companies (name),
          dispatcher:dispatcher_id (
            first_name,
            last_name,
            phone
          )
        `)
        .eq('user_id', user.id)
        .single();

      if (driverData) {
        setDriverId(driverData.id);
        setGpsConsent(driverData.gps_consent || false);

        // Set current location if available
        if (driverData.current_location_lat && driverData.current_location_lng) {
          setCurrentLocation({
            lat: Number(driverData.current_location_lat),
            lng: Number(driverData.current_location_lng),
            timestamp: driverData.last_location_update || '',
          });
        }

        // Set company info
        const dispatcher = driverData.dispatcher as any;
        setCompanyInfo({
          companyName: (driverData.companies as any)?.name || 'N/A',
          dispatcherName: dispatcher ? `${dispatcher.first_name} ${dispatcher.last_name}` : 'Not Assigned',
          dispatcherPhone: dispatcher?.phone || 'N/A',
          dispatcherEmail: 'contact@company.com',
        });

        // Fetch loads assigned to this driver only
        const { data: loadsData } = await supabase
          .from('loads')
          .select('*, invoices(amount, status)')
          .eq('driver_id', driverData.id)
          .order('created_at', { ascending: false });

        if (loadsData) {
          const activeLoads = loadsData.filter(load => 
            ['pending', 'in_transit', 'assigned'].includes(load.status)
          ).length;
          
          const completedLoads = loadsData.filter(load => 
            load.status === 'delivered'
          ).length;

          // Calculate total earnings from delivered loads
          const totalEarnings = loadsData
            .filter(load => load.status === 'delivered')
            .reduce((sum, load) => sum + (Number(load.rate) || 0), 0);

          // Calculate pending payments (delivered but invoice not paid)
          const pendingPayments = loadsData
            .filter(load => {
              const invoices = load.invoices as any[];
              return load.status === 'delivered' && 
                     (!invoices || invoices.length === 0 || 
                      invoices.some(inv => inv.status !== 'paid'));
            })
            .reduce((sum, load) => sum + (Number(load.rate) || 0), 0);

          setStats({
            myActiveLoads: activeLoads,
            myCompletedLoads: completedLoads,
            totalEarnings,
            pendingPayments,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching driver data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { 
      title: 'My Active Loads', 
      value: stats.myActiveLoads, 
      icon: TruckIcon, 
      gradient: 'from-blue-500 to-blue-600',
      description: 'Currently assigned'
    },
    { 
      title: 'Completed Loads', 
      value: stats.myCompletedLoads, 
      icon: CheckCircle, 
      gradient: 'from-green-500 to-green-600',
      description: 'Successfully delivered'
    },
    { 
      title: 'Total Earnings', 
      value: `$${stats.totalEarnings.toLocaleString()}`, 
      icon: DollarSign, 
      gradient: 'from-purple-500 to-purple-600',
      description: 'All time'
    },
    { 
      title: 'Pending Payments', 
      value: `$${stats.pendingPayments.toLocaleString()}`, 
      icon: DollarSign, 
      gradient: 'from-orange-500 to-orange-600',
      description: 'Awaiting payment'
    },
  ];

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              Driver Portal
            </h1>
            <p className="text-muted-foreground">Welcome back! Track your loads and earnings</p>
          </div>
          {currentLocation && <GPSStatusBadge lastUpdate={currentLocation.timestamp} />}
        </div>

        {/* Stats Cards with Gradients */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Card key={stat.title} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <div className={`h-2 bg-gradient-to-r ${stat.gradient}`} />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`p-2 rounded-lg bg-gradient-to-r ${stat.gradient} bg-opacity-10`}>
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Company & Dispatcher Info */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-blue-200 dark:border-blue-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                My Company
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Company Name</p>
                <p className="text-lg font-semibold">{companyInfo.companyName}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 dark:border-green-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-green-600" />
                My Dispatcher
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="text-lg font-semibold">{companyInfo.dispatcherName}</p>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a href={`tel:${companyInfo.dispatcherPhone}`} className="text-sm text-blue-600 hover:underline">
                  {companyInfo.dispatcherPhone}
                </a>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* GPS Location Card */}
        {driverId && currentLocation && (
          <Card className="border-purple-200 dark:border-purple-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="h-5 w-5 text-purple-600" />
                Current Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Coordinates:</span>
                  <Badge variant="outline">
                    {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Last Updated:</span>
                  <span className="text-sm">
                    {new Date(currentLocation.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* GPS Consent Dialog */}
        {driverId && !gpsConsent && (
          <GPSConsentDialog 
            open={!gpsConsent}
            driverId={driverId} 
            onConsent={(granted) => setGpsConsent(granted)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
