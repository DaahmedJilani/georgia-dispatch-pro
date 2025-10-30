import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface InviteTeamMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function InviteTeamMemberDialog({ open, onOpenChange, onSuccess }: InviteTeamMemberDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<string>('dispatcher');
  const [credentials, setCredentials] = useState<{
    username: string;
    temp_password: string;
    email: string;
  } | null>(null);

  const handleInvite = async () => {
    if (!email || !firstName || !lastName || !role) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    // Username is required for non-driver roles
    if (role !== 'driver' && !username) {
      toast({
        title: 'Username Required',
        description: 'Username is required for internal staff',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('invite-team-member', {
        body: {
          email,
          first_name: firstName,
          last_name: lastName,
          role,
          username: username || null,
        },
      });

      if (error) throw error;

      // Store credentials to display to admin
      if (data.credentials) {
        setCredentials(data.credentials);
      }

      toast({
        title: 'Success',
        description: 'Team member invited successfully. Save the credentials shown below.',
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send invitation',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCredentials(null);
    setEmail('');
    setFirstName('');
    setLastName('');
    setUsername('');
    setRole('dispatcher');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
        </DialogHeader>
        {credentials ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                Team Member Created Successfully
              </h3>
              <p className="text-sm text-green-800 dark:text-green-200 mb-4">
                Please share these credentials with the new team member. They will need to set a new password on first login.
              </p>
              <div className="space-y-2 bg-white dark:bg-gray-900 p-3 rounded border">
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Email:</span>
                  <p className="font-mono text-sm">{credentials.email}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Username:</span>
                  <p className="font-mono text-sm">{credentials.username}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Temporary Password:</span>
                  <p className="font-mono text-sm font-semibold">{credentials.temp_password}</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleClose}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="team.member@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                placeholder="John"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                placeholder="Doe"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="username">Username {role !== 'driver' && <span className="text-destructive">*</span>}</Label>
              <Input
                id="username"
                placeholder="john_dispatcher"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                disabled={role === 'driver'}
              />
              {role !== 'driver' && (
                <p className="text-xs text-muted-foreground mt-1">
                  Username for login (letters, numbers, underscores only)
                </p>
              )}
              {role === 'driver' && (
                <p className="text-xs text-muted-foreground mt-1">
                  Drivers login with email, not username
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="dispatcher">Dispatcher</SelectItem>
                  <SelectItem value="sales">Sales Agent</SelectItem>
                  <SelectItem value="treasury">Treasury</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleInvite} disabled={loading} className="w-full">
              {loading ? 'Sending...' : 'Send Invitation'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
