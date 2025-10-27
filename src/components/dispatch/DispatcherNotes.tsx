import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, AlertCircle, CheckCircle2 } from 'lucide-react';

interface DispatcherNote {
  id: string;
  note_text: string;
  admin_feedback: string | null;
  load_id: string | null;
  created_at: string;
  updated_at: string;
}

interface Load {
  id: string;
  load_number: string;
}

export const DispatcherNotes = () => {
  const [notes, setNotes] = useState<DispatcherNote[]>([]);
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [selectedLoad, setSelectedLoad] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch notes
      const { data: notesData, error: notesError } = await supabase
        .from('dispatcher_notes')
        .select('*')
        .eq('dispatcher_id', user.id)
        .order('created_at', { ascending: false });

      if (notesError) throw notesError;
      setNotes(notesData || []);

      // Fetch loads for dropdown
      const { data: loadsData, error: loadsError } = await supabase
        .from('loads')
        .select('id, load_number')
        .eq('dispatcher_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (loadsError) throw loadsError;
      setLoads(loadsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addNote = async () => {
    if (!newNote.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a note',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

      const { error } = await supabase.from('dispatcher_notes').insert({
        dispatcher_id: user.id,
        company_id: profile?.company_id,
        note_text: newNote,
        load_id: selectedLoad || null,
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Note added successfully',
      });

      setNewNote('');
      setSelectedLoad('');
      fetchData();
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        title: 'Error',
        description: 'Failed to add note',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div className="animate-pulse">Loading notes...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          My Notes & Admin Feedback
        </CardTitle>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm">Add Note</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Note</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Load (Optional)</label>
                <Select value={selectedLoad} onValueChange={setSelectedLoad}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a load..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No load</SelectItem>
                    {loads.map(load => (
                      <SelectItem key={load.id} value={load.id}>
                        {load.load_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Note</label>
                <Textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Enter your note..."
                  rows={4}
                />
              </div>
              <Button onClick={addNote} className="w-full">
                Save Note
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {notes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No notes yet. Add your first note!
            </div>
          ) : (
            notes.map(note => (
              <div
                key={note.id}
                className={`p-4 border rounded-lg ${
                  note.admin_feedback ? 'border-green-500 bg-green-50 dark:bg-green-950' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm text-muted-foreground">
                        {new Date(note.created_at).toLocaleString()}
                      </span>
                      {note.admin_feedback && (
                        <Badge variant="default" className="bg-green-600">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Admin Reviewed
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm">{note.note_text}</p>
                  </div>
                </div>
                {note.admin_feedback && (
                  <div className="mt-3 pt-3 border-t border-green-300">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1">
                          Admin Feedback:
                        </div>
                        <p className="text-sm text-green-800 dark:text-green-300">
                          {note.admin_feedback}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
