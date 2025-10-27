import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Send, Inbox, Plus } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const Messages = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'inbox' | 'sent'>('inbox');
  const [users, setUsers] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState({
    recipient_id: '',
    recipient_role: '',
    sender_role: '',
    subject: '',
    body: '',
    load_id: '',
  });

  useEffect(() => {
    fetchUserRole();
    fetchMessages();
    fetchUsers();

    // Subscribe to new messages
    const channel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          console.log('New message received:', payload);
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [view]);

  const fetchUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: role } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (role) {
        setUserRole(role.role);
        setNewMessage(prev => ({ ...prev, sender_role: role.role }));
      }
    } catch (error: any) {
      console.error('Error fetching user role:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const query = supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(user_id, first_name, last_name),
          recipient:profiles!messages_recipient_id_fkey(user_id, first_name, last_name),
          loads(load_number)
        `)
        .order('created_at', { ascending: false });

      if (view === 'inbox') {
        query.eq('recipient_id', user.id);
      } else {
        query.eq('sender_id', user.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      setMessages(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's role to filter available recipients
      const { data: currentUserRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      // Role-based message routing
      let roleFilter: string[] = [];
      if (currentUserRole?.role === 'dispatcher') {
        roleFilter = ['driver', 'admin'];
      } else if (currentUserRole?.role === 'sales') {
        roleFilter = ['carrier', 'driver', 'admin'];
      } else if (currentUserRole?.role === 'treasury') {
        roleFilter = ['admin'];
      } else if (currentUserRole?.role === 'admin') {
        roleFilter = ['sales', 'dispatcher', 'treasury', 'driver'];
      }

      const { data, error } = await supabase
        .from('profiles')
        .select(`
          user_id, 
          first_name, 
          last_name,
          user_roles!inner(role)
        `)
        .order('first_name');

      if (error) throw error;

      // Filter based on allowed roles
      const filteredUsers = roleFilter.length > 0
        ? data?.filter((u: any) => roleFilter.includes(u.user_roles[0]?.role))
        : data;

      setUsers(filteredUsers || []);
    } catch (error: any) {
      console.error('Error fetching users:', error);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId);

      if (error) throw error;
      fetchMessages();
    } catch (error: any) {
      console.error('Error marking message as read:', error);
    }
  };

  const sendMessage = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.company_id) return;

      const { error } = await supabase
        .from('messages')
        .insert({
          company_id: profile.company_id,
          sender_id: user.id,
          recipient_id: newMessage.recipient_id,
          sender_role: newMessage.sender_role,
          recipient_role: newMessage.recipient_role,
          subject: newMessage.subject,
          body: newMessage.body,
          load_id: newMessage.load_id || null,
        });

      if (error) throw error;

      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully",
      });

      setNewMessage({ 
        recipient_id: '', 
        recipient_role: '',
        sender_role: userRole || '',
        subject: '', 
        body: '', 
        load_id: '' 
      });
      fetchMessages();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const unreadCount = messages.filter(m => !m.is_read && view === 'inbox').length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <MessageCircle className="w-8 h-8" />
              Messages
            </h1>
            <p className="text-muted-foreground">
              Communicate with your team members
            </p>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Message
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Compose Message</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                 <div>
                   <Label>Recipient</Label>
                   <Select
                     value={newMessage.recipient_id}
                     onValueChange={(value) => {
                       const selectedUser = users.find(u => u.user_id === value);
                       setNewMessage({ 
                         ...newMessage, 
                         recipient_id: value,
                         recipient_role: selectedUser?.user_roles[0]?.role || ''
                       });
                     }}
                   >
                     <SelectTrigger>
                       <SelectValue placeholder="Select recipient" />
                     </SelectTrigger>
                     <SelectContent>
                       {users.map((user) => (
                         <SelectItem key={user.user_id} value={user.user_id}>
                           {user.first_name} {user.last_name}
                           {user.user_roles[0]?.role && (
                             <Badge className="ml-2" variant="outline">
                               {user.user_roles[0].role}
                             </Badge>
                           )}
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>

                <div>
                  <Label>Subject</Label>
                  <Input
                    placeholder="Message subject"
                    value={newMessage.subject}
                    onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Message</Label>
                  <Textarea
                    placeholder="Type your message..."
                    rows={6}
                    value={newMessage.body}
                    onChange={(e) => setNewMessage({ ...newMessage, body: e.target.value })}
                  />
                </div>

                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.recipient_id || !newMessage.body}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Mailbox</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant={view === 'inbox' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setView('inbox')}
              >
                <Inbox className="w-4 h-4 mr-2" />
                Inbox
                {unreadCount > 0 && (
                  <Badge className="ml-auto" variant="destructive">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
              <Button
                variant={view === 'sent' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setView('sent')}
              >
                <Send className="w-4 h-4 mr-2" />
                Sent
              </Button>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>{view === 'inbox' ? 'Inbox' : 'Sent Messages'}</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading messages...
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No messages yet
                </div>
              ) : (
                <ScrollArea className="h-[600px]">
                  <div className="space-y-3">
                    {messages.map((message) => (
                      <Card
                        key={message.id}
                        className={`p-4 cursor-pointer transition-smooth hover:shadow-md ${
                          !message.is_read && view === 'inbox' ? 'bg-primary/5 border-primary/20' : ''
                        }`}
                        onClick={() => {
                          setSelectedMessage(message);
                          if (!message.is_read && view === 'inbox') {
                            markAsRead(message.id);
                          }
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {!message.is_read && view === 'inbox' && (
                                <div className="w-2 h-2 rounded-full bg-primary" />
                              )}
                              <p className="font-semibold">
                                {view === 'inbox'
                                  ? `${message.sender?.first_name} ${message.sender?.last_name}`
                                  : `To: ${message.recipient?.first_name} ${message.recipient?.last_name}`}
                              </p>
                            </div>
                            <p className="text-sm font-medium text-muted-foreground">
                              {message.subject || 'No Subject'}
                            </p>
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {message.body}
                            </p>
                            {message.loads && (
                              <Badge variant="outline" className="mt-2">
                                Load: {message.loads.load_number}
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(message.created_at), 'MMM d, h:mm a')}
                          </span>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Messages;
