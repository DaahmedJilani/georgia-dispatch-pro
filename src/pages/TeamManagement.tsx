import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { InviteTeamMemberDialog } from '@/components/team/InviteTeamMemberDialog';
import { useToast } from '@/hooks/use-toast';

interface TeamMember {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  created_at: string;
}

export default function TeamManagement() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.company_id) return;

      const { data: members } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          user_id,
          created_at,
          user_roles!inner(role)
        `)
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false });

      if (members) {
        // Get email for each user
        const formattedMembers = await Promise.all(
          members.map(async (member: any) => {
            const { data: authUser } = await supabase.auth.admin.getUserById(member.user_id);
            return {
              id: member.id,
              first_name: member.first_name || 'N/A',
              last_name: member.last_name || 'N/A',
              email: authUser?.user?.email || 'N/A',
              role: member.user_roles[0]?.role || 'N/A',
              created_at: member.created_at
            };
          })
        );
        setTeamMembers(formattedMembers);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
      toast({
        title: 'Error',
        description: 'Failed to load team members',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Team Management</h1>
            <p className="text-muted-foreground">Manage your team members and their roles</p>
          </div>
          <Button onClick={() => setInviteDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Invite Team Member
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      {member.first_name} {member.last_name}
                    </TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{member.role}</Badge>
                    </TableCell>
                    <TableCell>{new Date(member.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant="default">Active</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <InviteTeamMemberDialog 
          open={inviteDialogOpen} 
          onOpenChange={setInviteDialogOpen}
          onSuccess={fetchTeamMembers}
        />
      </div>
    </DashboardLayout>
  );
}
