import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Copy, Send } from "lucide-react";

interface AIAssistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loadData?: any;
}

export const AIAssistDialog = ({ open, onOpenChange, loadData }: AIAssistDialogProps) => {
  const { toast } = useToast();
  const [assistType, setAssistType] = useState<"load_summary" | "draft_email" | "smart_reminder">("load_summary");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [emailContext, setEmailContext] = useState("");
  const [recipientType, setRecipientType] = useState("driver");

  const generateAI = async () => {
    if (assistType === "draft_email" && !emailContext.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide email context",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResult("");

    try {
      let requestData: any = {};

      switch (assistType) {
        case "load_summary":
          requestData = {
            pickup_location: loadData.pickup_location,
            pickup_city: loadData.pickup_city,
            pickup_state: loadData.pickup_state,
            delivery_location: loadData.delivery_location,
            delivery_city: loadData.delivery_city,
            delivery_state: loadData.delivery_state,
            commodity: loadData.commodity,
            weight: loadData.weight,
            pickup_date: loadData.pickup_date,
            delivery_date: loadData.delivery_date,
            pickup_notes: loadData.pickup_notes,
            delivery_notes: loadData.delivery_notes,
          };
          break;

        case "draft_email":
          requestData = {
            recipient_type: recipientType,
            recipient_name: recipientType === "driver" ? loadData.drivers?.first_name + " " + loadData.drivers?.last_name : loadData.brokers?.name,
            subject: `Load ${loadData.load_number}`,
            context: emailContext,
          };
          break;

        case "smart_reminder":
          requestData = {
            load_number: loadData.load_number,
            driver_name: loadData.drivers?.first_name + " " + loadData.drivers?.last_name,
            pickup_city: loadData.pickup_city,
            pickup_state: loadData.pickup_state,
            pickup_date: loadData.pickup_date,
            status: loadData.status,
          };
          break;
      }

      const { data, error } = await supabase.functions.invoke('ai-assist', {
        body: {
          type: assistType,
          data: requestData,
        },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setResult(data.content);
      
      toast({
        title: "AI Generated Successfully",
        description: "Your content is ready",
      });
    } catch (error: any) {
      console.error("AI assist error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate AI content",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    toast({
      title: "Copied",
      description: "Content copied to clipboard",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            AI Assistant
          </DialogTitle>
          <DialogDescription>
            Let AI help you with load management tasks
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">What would you like AI to help with?</label>
            <Select value={assistType} onValueChange={(value: any) => setAssistType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="load_summary">Generate Load Instructions</SelectItem>
                <SelectItem value="draft_email">Draft Email</SelectItem>
                <SelectItem value="smart_reminder">Create Smart Reminder</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {assistType === "draft_email" && (
            <>
              <div>
                <label className="text-sm font-medium">Recipient Type</label>
                <Select value={recipientType} onValueChange={setRecipientType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="driver">Driver</SelectItem>
                    <SelectItem value="broker">Broker</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Email Context / Purpose</label>
                <Textarea
                  placeholder="What is this email about? E.g., 'Confirm pickup time and special instructions'"
                  rows={3}
                  value={emailContext}
                  onChange={(e) => setEmailContext(e.target.value)}
                />
              </div>
            </>
          )}

          <Button onClick={generateAI} disabled={loading} className="w-full">
            <Sparkles className="w-4 h-4 mr-2" />
            {loading ? "Generating..." : "Generate with AI"}
          </Button>

          {result && (
            <div className="space-y-2">
              <label className="text-sm font-medium">AI Generated Content:</label>
              <div className="relative">
                <Textarea
                  value={result}
                  readOnly
                  rows={12}
                  className="font-mono text-sm"
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  <Button size="sm" variant="outline" onClick={copyToClipboard}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};