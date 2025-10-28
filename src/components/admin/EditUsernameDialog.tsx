import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface EditUsernameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  currentUsername: string | null;
  onSuccess: () => void;
}

export function EditUsernameDialog({ 
  open, 
  onOpenChange, 
  userId, 
  currentUsername,
  onSuccess 
}: EditUsernameDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState(currentUsername || '');

  useEffect(() => {
    setUsername(currentUsername || '');
  }, [currentUsername]);

  const handleSave = async () => {
    if (!username || username.trim().length < 3) {
      toast({
        title: 'Invalid Username',
        description: 'Username must be at least 3 characters',
        variant: 'destructive',
      });
      return;
    }

    // Validate username format (alphanumeric and underscores only)
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      toast({
        title: 'Invalid Username',
        description: 'Username can only contain letters, numbers, and underscores',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ username: username.toLowerCase() })
        .eq('user_id', userId);

      if (error) {
        if (error.code === '23505') {
          throw new Error('Username already taken');
        }
        throw error;
      }

      toast({
        title: 'Username Updated',
        description: `Username set to: ${username.toLowerCase()}`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update username',
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
          <DialogTitle>Edit Username</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder="username_123"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Letters, numbers, and underscores only. Will be converted to lowercase.
            </p>
          </div>
          <Button onClick={handleSave} disabled={loading} className="w-full">
            {loading ? 'Saving...' : 'Save Username'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}