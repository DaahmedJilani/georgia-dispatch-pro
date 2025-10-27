import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TruckIcon, Users, Building2, DollarSign, Plus, Shield, Eye, BarChart3, UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface DashboardStats {
  totalLoads: number;
  activeDrivers: number;
  teamMembers: number;
  totalRevenue: number;
}

interface TeamMember {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalLoads: 0,
    activeDrivers: 0,
    teamMembers: 0,
    totalRevenue: 0,
  });
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.company_id) return;

      const [loadsResult, driversResult, invoicesResult, teamResult] = await Promise.all([
        supabase.from('loads').select('id', { count: 'exact' }).eq('company_id', profile.company_id),
        supabase.from('drivers').select('id', { count: 'exact' }).eq('company_id', profile.company_id).eq('status', 'available'),
        supabase.from('invoices').select('amount').eq('company_id', profile.company_id).eq('status', 'paid'),
        supabase
          .from('profiles')
          .select(`
            id,
            first_name,
            last_name,
            user_id,
            user_roles!inner(role)
          `)
          .eq('company_id', profile.company_id)
      ]);

      const revenue = invoicesResult.data?.reduce((sum, inv) => sum + Number(inv.amount), 0) || 0;

      setStats({
        totalLoads: loadsResult.count || 0,
        activeDrivers: driversResult.count || 0,
        teamMembers: teamResult.data?.length || 0,
        totalRevenue: revenue,
      });

      // Format team members data
      const formattedTeam = teamResult.data?.map((member: any) => ({
        id: member.id,
        first_name: member.first_name || 'N/A',
        last_name: member.last_name || 'N/A',
        email: member.user_id,
        role: member.user_roles[0]?.role || 'N/A'
      })) || [];

      setTeamMembers(formattedTeam);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: 'Total Loads', value: stats.totalLoads, icon: TruckIcon, color: 'text-blue-600' },
    { title: 'Active Drivers', value: stats.activeDrivers, icon: Users, color: 'text-green-600' },
    { title: 'Team Members', value: stats.teamMembers, icon: Building2, color: 'text-purple-600' },
    { title: 'Total Revenue', value: `$${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-orange-600' },
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold" style={{ background: 'var(--gradient-admin)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground">Manage your company operations and team</p>
            <Badge className="mt-2" style={{ background: 'hsl(var(--role-admin))', color: 'hsl(var(--role-admin-foreground))' }}>
              Company Administrator
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/analytics')}>
              <BarChart3 className="mr-2 h-4 w-4" />
              Analytics
            </Button>
            <Button variant="outline" onClick={() => navigate('/audit-logs')}>
              <Shield className="mr-2 h-4 w-4" />
              Audit Logs
            </Button>
            <Button style={{ background: 'hsl(var(--role-admin))' }} onClick={() => navigate('/team')}>
              <Plus className="mr-2 h-4 w-4" />
              Manage Team
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Card key={stat.title} className="overflow-hidden hover:shadow-lg transition-all">
              <div className="h-2 bg-gradient-to-r from-primary to-primary/60" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className="p-2 rounded-lg bg-primary/10">
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <Progress value={65} className="mt-2 h-1" />
                <p className="text-xs text-muted-foreground mt-1">+12% from last month</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        {member.first_name} {member.last_name}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline"
                          style={{
                            background: member.role === 'sales' ? 'hsl(var(--role-sales))' :
                              member.role === 'dispatcher' ? 'hsl(var(--role-dispatch))' :
                              member.role === 'treasury' ? 'hsl(var(--role-treasury))' :
                              'hsl(var(--role-admin))',
                            color: 'white'
                          }}
                        >
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">Active</Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCog className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/team')}>
                <Plus className="mr-2 h-4 w-4" />
                Add Team Member
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/loads')}>
                <TruckIcon className="mr-2 h-4 w-4" />
                Create New Load
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/carriers')}>
                <Building2 className="mr-2 h-4 w-4" />
                Add Carrier
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/settings')}>
                <Shield className="mr-2 h-4 w-4" />
                Company Settings
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
