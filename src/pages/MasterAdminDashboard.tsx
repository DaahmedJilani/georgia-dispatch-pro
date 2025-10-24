import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, TruckIcon, DollarSign } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface CompanyStats {
  id: string;
  name: string;
  userCount: number;
  loadCount: number;
  totalRevenue: number;
  status: string;
  created_at: string;
}

export default function MasterAdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<CompanyStats[]>([]);
  const [totalCompanies, setTotalCompanies] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalLoads, setTotalLoads] = useState(0);
  const [activeCompanies, setActiveCompanies] = useState(0);

  useEffect(() => {
    fetchMasterAdminData();
  }, []);

  const fetchMasterAdminData = async () => {
    try {
      // Fetch all companies
      const { data: companiesData } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });

      if (companiesData) {
        setTotalCompanies(companiesData.length);
        setActiveCompanies(companiesData.filter(c => c.subscription_status === 'active').length);

        // Fetch stats for each company
        const companyStats = await Promise.all(
          companiesData.map(async (company) => {
            const [usersResult, loadsResult, invoicesResult] = await Promise.all([
              supabase.from('profiles').select('id', { count: 'exact' }).eq('company_id', company.id),
              supabase.from('loads').select('id', { count: 'exact' }).eq('company_id', company.id),
              supabase.from('invoices').select('amount').eq('company_id', company.id).eq('status', 'paid')
            ]);

            const revenue = invoicesResult.data?.reduce((sum, inv) => sum + Number(inv.amount), 0) || 0;

            return {
              id: company.id,
              name: company.name,
              userCount: usersResult.count || 0,
              loadCount: loadsResult.count || 0,
              totalRevenue: revenue,
              status: company.subscription_status || 'active',
              created_at: company.created_at
            };
          })
        );

        setCompanies(companyStats);
        setTotalRevenue(companyStats.reduce((sum, c) => sum + c.totalRevenue, 0));
        setTotalLoads(companyStats.reduce((sum, c) => sum + c.loadCount, 0));
      }
    } catch (error) {
      console.error('Error fetching master admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: 'Total Companies', value: totalCompanies, icon: Building2, color: 'text-blue-600' },
    { title: 'Total Revenue', value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-green-600' },
    { title: 'Active Companies', value: activeCompanies, icon: Users, color: 'text-purple-600' },
    { title: 'Total Loads', value: totalLoads, icon: TruckIcon, color: 'text-orange-600' },
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
        <div>
          <h1 className="text-3xl font-bold">Master Admin Dashboard</h1>
          <p className="text-muted-foreground">System-wide overview and company management</p>
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

        <Card>
          <CardHeader>
            <CardTitle>Company Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company Name</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Loads</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium">{company.name}</TableCell>
                    <TableCell>{company.userCount}</TableCell>
                    <TableCell>{company.loadCount}</TableCell>
                    <TableCell>${company.totalRevenue.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={company.status === 'active' ? 'default' : 'secondary'}>
                        {company.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(company.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
