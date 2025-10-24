import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, TruckIcon, DollarSign } from 'lucide-react';

interface Company {
  id: string;
  name: string;
  created_at: string;
  subscription_status: string;
  userCount: number;
  loadCount: number;
  totalRevenue: number;
}

export default function CompaniesManagement() {
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [stats, setStats] = useState({
    totalCompanies: 0,
    totalRevenue: 0,
    totalUsers: 0,
    totalLoads: 0,
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const { data: companiesData } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });

      if (companiesData) {
        const companiesWithStats = await Promise.all(
          companiesData.map(async (company) => {
            const [usersResult, loadsResult, invoicesResult] = await Promise.all([
              supabase.from('profiles').select('id', { count: 'exact' }).eq('company_id', company.id),
              supabase.from('loads').select('id', { count: 'exact' }).eq('company_id', company.id),
              supabase.from('invoices').select('amount').eq('company_id', company.id).eq('status', 'paid')
            ]);

            const revenue = invoicesResult.data?.reduce((sum, inv) => sum + Number(inv.amount), 0) || 0;

            return {
              ...company,
              userCount: usersResult.count || 0,
              loadCount: loadsResult.count || 0,
              totalRevenue: revenue,
            };
          })
        );

        setCompanies(companiesWithStats);
        setStats({
          totalCompanies: companiesWithStats.length,
          totalRevenue: companiesWithStats.reduce((sum, c) => sum + c.totalRevenue, 0),
          totalUsers: companiesWithStats.reduce((sum, c) => sum + c.userCount, 0),
          totalLoads: companiesWithStats.reduce((sum, c) => sum + c.loadCount, 0),
        });
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: 'Total Companies', value: stats.totalCompanies, icon: Building2, color: 'text-blue-600' },
    { title: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-green-600' },
    { title: 'Total Loads', value: stats.totalLoads, icon: TruckIcon, color: 'text-orange-600' },
    { title: 'Total Revenue', value: `$${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-purple-600' },
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
          <h1 className="text-3xl font-bold">Company Management</h1>
          <p className="text-muted-foreground">Monitor all companies in the system</p>
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
            <CardTitle>All Companies</CardTitle>
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
                    <TableCell className="font-semibold">
                      ${company.totalRevenue.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={company.subscription_status === 'active' ? 'default' : 'secondary'}>
                        {company.subscription_status}
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
