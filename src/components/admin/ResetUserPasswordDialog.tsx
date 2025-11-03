import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ResetUserPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userEmail: string;
  userName: string;
}

export function ResetUserPasswordDialog({ 
  open, 
  onOpenChange, 
  userId, 
  userEmail,
  userName 
}: ResetUserPasswordDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  const handleSendResetEmail = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('admin-reset-user-password', {
        body: {
          targetUserId: userId,
          sendEmail: true,
        },
      });

      if (error) throw error;

      toast({
        title: 'Reset Email Sent',
        description: `Password reset email sent to ${userEmail}`,
      });

      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send reset email',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      toast({
        title: 'Invalid Password',
        description: 'Password must be at least 8 characters and include uppercase, lowercase, numbers, and special characters',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await supabase.functions.invoke('admin-reset-user-password', {
        body: {
          targetUserId: userId,
          newPassword: newPassword,
        },
      });

      console.log('Full response:', response);

      // Check if there's an error in the response
      if (response.error) {
        let errorMessage = 'Failed to update password';
        
        // Try to parse the error context which may contain our custom message
        if (response.error.context) {
          try {
            const context = typeof response.error.context === 'string' 
              ? JSON.parse(response.error.context) 
              : response.error.context;
            errorMessage = context.message || context.error || errorMessage;
          } catch (e) {
            console.error('Failed to parse error context:', e);
          }
        }
        
        // Fallback to direct error message
        errorMessage = response.error.message || errorMessage;
        
        throw new Error(errorMessage);
      }
      
      // Check data for error/message (success case should have success: true)
      if (response.data) {
        if (response.data.error) {
          throw new Error(response.data.error);
        }
        if (response.data.message && !response.data.success) {
          throw new Error(response.data.message);
        }
      }

      toast({
        title: 'Password Updated',
        description: `Password updated for ${userName}`,
      });

      setNewPassword('');
      onOpenChange(false);
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast({
        title: 'Error',
        description: error.message || error.toString() || 'Failed to update password',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription>
            Reset password for {userName} ({userEmail})
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="email" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email">Send Reset Email</TabsTrigger>
            <TabsTrigger value="set">Set New Password</TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Send a password reset email to the user. They will receive a secure link to reset their password.
            </p>
            <Button 
              onClick={handleSendResetEmail} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Sending...' : 'Send Reset Email'}
            </Button>
          </TabsContent>

          <TabsContent value="set" className="space-y-4">
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Strong password (min 8 chars, mixed case, numbers, symbols)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
              />
              <p className="text-xs text-muted-foreground mt-1">
                User will not receive an email notification
              </p>
            </div>
            <Button 
              onClick={handleSetPassword} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Updating...' : 'Set New Password'}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}