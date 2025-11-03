import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, UserCog, Key, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { InviteTeamMemberDialog } from '@/components/team/InviteTeamMemberDialog';
import { RoleAssignmentDialog } from '@/components/team/RoleAssignmentDialog';
import { ResetUserPasswordDialog } from '@/components/admin/ResetUserPasswordDialog';
import { EditUsernameDialog } from '@/components/admin/EditUsernameDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface TeamMember {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  username: string | null;
  role: string;
  created_at: string;
}

export default function TeamManagement() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [editUsernameDialogOpen, setEditUsernameDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ 
    id: string; 
    user_id: string;
    role?: string;
    email: string;
    name: string;
    username: string | null;
  } | null>(null);

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

      // Call edge function to get team members with emails
      const { data: teamData, error: teamError } = await supabase.functions.invoke('get-team-members');

      if (teamError) throw teamError;

      if (teamData?.team_members) {
        setTeamMembers(teamData.team_members);
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

  const handleDeleteMember = async () => {
    if (!selectedUser) return;

    try {
      // Delete user_roles entry
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', selectedUser.user_id);

      if (roleError) throw roleError;

      // Delete profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', selectedUser.user_id);

      if (profileError) throw profileError;

      // Delete auth user via edge function
      const { error: authError } = await supabase.functions.invoke('delete-user', {
        body: { user_id: selectedUser.user_id }
      });

      if (authError) throw authError;

      toast({
        title: "Success",
        description: `${selectedUser.name} has been removed from the team`,
      });

      setDeleteDialogOpen(false);
      setSelectedUser(null);
      fetchTeamMembers();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete team member",
      });
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
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
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
                      <div className="flex items-center gap-2">
                        {member.username ? (
                          <span className="font-mono text-sm">{member.username}</span>
                        ) : (
                          <span className="text-muted-foreground text-sm">No username</span>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => {
                            setSelectedUser({ 
                              id: member.id, 
                              user_id: member.user_id,
                              role: member.role,
                              email: member.email,
                              name: `${member.first_name} ${member.last_name}`,
                              username: member.username
                            });
                            setEditUsernameDialogOpen(true);
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline"
                        style={{
                          background: member.role === 'sales' ? 'hsl(var(--role-sales))' :
                            member.role === 'dispatcher' ? 'hsl(var(--role-dispatch))' :
                            member.role === 'treasury' ? 'hsl(var(--role-treasury))' :
                            member.role === 'admin' ? 'hsl(var(--role-admin))' :
                            'hsl(var(--muted))',
                          color: member.role !== 'N/A' ? 'white' : 'inherit'
                        }}
                      >
                        {member.role}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(member.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedUser({ 
                              id: member.id, 
                              user_id: member.user_id,
                              role: member.role,
                              email: member.email,
                              name: `${member.first_name} ${member.last_name}`,
                              username: member.username
                            });
                            setRoleDialogOpen(true);
                          }}
                          title="Change Role"
                        >
                          <UserCog className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedUser({ 
                              id: member.id, 
                              user_id: member.user_id,
                              role: member.role,
                              email: member.email,
                              name: `${member.first_name} ${member.last_name}`,
                              username: member.username
                            });
                            setResetPasswordDialogOpen(true);
                          }}
                          title="Reset Password"
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedUser({
                              id: member.id,
                              user_id: member.user_id,
                              role: member.role,
                              email: member.email,
                              name: `${member.first_name} ${member.last_name}`,
                              username: member.username
                            });
                            setDeleteDialogOpen(true);
                          }}
                          title="Remove Team Member"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
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

      {selectedUser && (
        <>
          <RoleAssignmentDialog
            open={roleDialogOpen}
            onOpenChange={setRoleDialogOpen}
            userId={selectedUser.id}
            currentRole={selectedUser.role}
            onSuccess={fetchTeamMembers}
          />
          <ResetUserPasswordDialog
            open={resetPasswordDialogOpen}
            onOpenChange={setResetPasswordDialogOpen}
            userId={selectedUser.user_id}
            userEmail={selectedUser.email}
            userName={selectedUser.name}
          />
          <EditUsernameDialog
            open={editUsernameDialogOpen}
            onOpenChange={setEditUsernameDialogOpen}
            userId={selectedUser.user_id}
            currentUsername={selectedUser.username}
            onSuccess={fetchTeamMembers}
          />
        </>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {selectedUser?.name} from the team?
              This will permanently delete their account and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
