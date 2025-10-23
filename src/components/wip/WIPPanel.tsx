import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface WIPAssignment {
  id: string;
  user_id: string;
  load_id: string | null;
  driver_id: string | null;
  carrier_id: string | null;
  status: string;
  requested_at: string;
  assigned_at: string | null;
  assigned_by: string | null;
  notes: string | null;
  profiles: {
    first_name: string;
    last_name: string;
  };
}

export function WIPPanel() {
  const [assignments, setAssignments] = useState<WIPAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [actionNotes, setActionNotes] = useState<{ [key: string]: string }>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchUserRole();
    fetchAssignments();

    const channel = supabase
      .channel("wip-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "wip_assignments",
        },
        () => {
          fetchAssignments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    setUserRole(data?.role || null);
  };

  const fetchAssignments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("wip_assignments")
        .select(`
          *,
          profiles!wip_assignments_user_id_fkey(first_name, last_name)
        `)
        .order("requested_at", { ascending: false });

      if (error) throw error;
      setAssignments(data || []);
    } catch (error) {
      console.error("Error fetching WIP assignments:", error);
      toast({
        title: "Error",
        description: "Failed to load WIP assignments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (assignmentId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("wip_assignments")
        .update({
          status: "approved",
          assigned_at: new Date().toISOString(),
          assigned_by: user.id,
          notes: actionNotes[assignmentId] || null,
        })
        .eq("id", assignmentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Assignment approved successfully",
      });

      setActionNotes((prev) => {
        const newNotes = { ...prev };
        delete newNotes[assignmentId];
        return newNotes;
      });
    } catch (error) {
      console.error("Error approving assignment:", error);
      toast({
        title: "Error",
        description: "Failed to approve assignment",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (assignmentId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("wip_assignments")
        .update({
          status: "rejected",
          assigned_at: new Date().toISOString(),
          assigned_by: user.id,
          notes: actionNotes[assignmentId] || null,
        })
        .eq("id", assignmentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Assignment rejected",
      });

      setActionNotes((prev) => {
        const newNotes = { ...prev };
        delete newNotes[assignmentId];
        return newNotes;
      });
    } catch (error) {
      console.error("Error rejecting assignment:", error);
      toast({
        title: "Error",
        description: "Failed to reject assignment",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-500/10"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-500/10"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-500/10"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Work in Progress Assignments</CardTitle>
        <CardDescription>
          {userRole === "admin" ? "Review and approve assignment requests" : "Your pending assignment requests"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {assignments.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No assignments found</p>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">
                      {assignment.profiles.first_name} {assignment.profiles.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Requested: {new Date(assignment.requested_at).toLocaleString()}
                    </p>
                    {assignment.notes && (
                      <p className="text-sm mt-2 text-muted-foreground">Note: {assignment.notes}</p>
                    )}
                  </div>
                  {getStatusBadge(assignment.status)}
                </div>

                {userRole === "admin" && assignment.status === "pending" && (
                  <div className="space-y-3 pt-3 border-t">
                    <div>
                      <Label htmlFor={`notes-${assignment.id}`}>Admin Notes (Optional)</Label>
                      <Textarea
                        id={`notes-${assignment.id}`}
                        placeholder="Add notes about this assignment..."
                        value={actionNotes[assignment.id] || ""}
                        onChange={(e) =>
                          setActionNotes((prev) => ({
                            ...prev,
                            [assignment.id]: e.target.value,
                          }))
                        }
                        className="mt-1"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(assignment.id)}
                        className="flex-1"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(assignment.id)}
                        className="flex-1"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
