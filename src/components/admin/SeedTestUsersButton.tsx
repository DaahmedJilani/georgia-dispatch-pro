import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Users, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export function SeedTestUsersButton() {
  const [loading, setLoading] = useState(false);

  const handleSeedUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('seed-test-users');

      if (error) throw error;

      toast.success('Test users created successfully!', {
        description: `Created ${data.results.filter((r: any) => r.success).length} test users`,
      });

      console.log('Seed results:', data);
    } catch (error: any) {
      console.error('Error seeding test users:', error);
      toast.error('Failed to create test users', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Users...
            </>
          ) : (
            <>
              <Users className="mr-2 h-4 w-4" />
              Seed Test Users
            </>
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Create Test Users?</AlertDialogTitle>
          <AlertDialogDescription>
            This will create 8 test users across 2 companies:
            <br />
            <br />
            <strong>Test Logistics LLC:</strong>
            <br />
            • admin@testlogistics.com (Admin)
            <br />
            • sales@testlogistics.com (Sales)
            <br />
            • dispatch@testlogistics.com (Dispatcher)
            <br />
            • treasury@testlogistics.com (Treasury)
            <br />
            • driver@testlogistics.com (Driver)
            <br />
            <br />
            <strong>Demo Freight Corp:</strong>
            <br />
            • admin@demofreight.com (Admin)
            <br />
            • sales@demofreight.com (Sales)
            <br />
            • dispatch@demofreight.com (Dispatcher)
            <br />
            <br />
            All users will have password: <code>TestPass123!</code>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleSeedUsers}>
            Create Test Users
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
