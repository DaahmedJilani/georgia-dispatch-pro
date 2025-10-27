import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Clock, CheckCircle, XCircle, FileCheck, Rocket } from 'lucide-react';

interface Carrier {
  id: string;
  name: string;
  sale_stage: string;
  contract_status: string;
  stage_updated_at: string;
  stage_updated_by: string | null;
}

interface StageUpdate {
  carrierId: string;
  newStage: string;
  notes: string;
}

const STAGE_CONFIG = {
  follow_up: { label: 'Follow-up', icon: Clock, color: 'bg-blue-500', description: 'Initial contact or callback' },
  promise: { label: 'Promised', icon: FileCheck, color: 'bg-yellow-500', description: 'Verbal agreement' },
  closed: { label: 'Closed', icon: CheckCircle, color: 'bg-purple-500', description: 'Contract ready' },
  activated: { label: 'Activated', icon: Rocket, color: 'bg-green-500', description: 'Fully onboarded' },
  denied: { label: 'Denied', icon: XCircle, color: 'bg-red-500', description: 'Lead rejected' },
};

export const SalesWorkflowTracker = () => {
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCarrier, setSelectedCarrier] = useState<string | null>(null);
  const [newStage, setNewStage] = useState<string>('');
  const [notes, setNotes] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchCarriers();
  }, []);

  const fetchCarriers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('carriers')
        .select('*')
        .eq('sales_agent_id', user.id)
        .order('stage_updated_at', { ascending: false });

      if (error) throw error;
      setCarriers(data || []);
    } catch (error) {
      console.error('Error fetching carriers:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStage = async () => {
    if (!selectedCarrier || !newStage) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('carriers')
        .update({
          sale_stage: newStage,
          stage_updated_by: user.id,
        })
        .eq('id', selectedCarrier);

      if (error) throw error;

      // Log activity
      await supabase.from('sales_activities').insert({
        sales_agent_id: user.id,
        entity_type: 'carrier',
        entity_id: selectedCarrier,
        activity_type: 'stage_update',
        notes: `Stage updated to ${newStage}. Notes: ${notes}`,
        company_id: (await supabase.from('profiles').select('company_id').eq('user_id', user.id).single()).data?.company_id,
      });

      toast({
        title: 'Stage Updated',
        description: `Carrier moved to ${STAGE_CONFIG[newStage as keyof typeof STAGE_CONFIG].label}`,
      });

      setSelectedCarrier(null);
      setNewStage('');
      setNotes('');
      fetchCarriers();
    } catch (error) {
      console.error('Error updating stage:', error);
      toast({
        title: 'Error',
        description: 'Failed to update stage',
        variant: 'destructive',
      });
    }
  };

  const getStageStats = () => {
    const stats = {
      follow_up: 0,
      promise: 0,
      closed: 0,
      activated: 0,
      denied: 0,
    };

    carriers.forEach(carrier => {
      if (carrier.sale_stage in stats) {
        stats[carrier.sale_stage as keyof typeof stats]++;
      }
    });

    return stats;
  };

  const stats = getStageStats();

  if (loading) {
    return <div className="animate-pulse">Loading workflow...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Sales Pipeline Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4">
            {Object.entries(STAGE_CONFIG).map(([key, config]) => {
              const Icon = config.icon;
              return (
                <div key={key} className="text-center space-y-2">
                  <div className={`w-16 h-16 mx-auto rounded-full ${config.color} flex items-center justify-center`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-2xl font-bold">{stats[key as keyof typeof stats]}</div>
                  <div className="text-sm text-muted-foreground">{config.label}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Carriers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {carriers.filter(c => c.sale_stage !== 'denied').map(carrier => {
              const stageConfig = STAGE_CONFIG[carrier.sale_stage as keyof typeof STAGE_CONFIG];
              const Icon = stageConfig?.icon || Clock;

              return (
                <div key={carrier.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full ${stageConfig?.color} flex items-center justify-center`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold">{carrier.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Updated {new Date(carrier.stage_updated_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{stageConfig?.label}</Badge>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedCarrier(carrier.id);
                            setNewStage(carrier.sale_stage);
                          }}
                        >
                          Update Stage
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Update Carrier Stage</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium">New Stage</label>
                            <Select value={newStage} onValueChange={setNewStage}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(STAGE_CONFIG).map(([key, config]) => (
                                  <SelectItem key={key} value={key}>
                                    {config.label} - {config.description}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-sm font-medium">Notes</label>
                            <Textarea
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              placeholder="Add notes about this update..."
                              rows={3}
                            />
                          </div>
                          <Button onClick={updateStage} className="w-full">
                            Update Stage
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
