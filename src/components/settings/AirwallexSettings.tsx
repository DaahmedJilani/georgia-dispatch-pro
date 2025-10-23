import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Shield, AlertTriangle } from "lucide-react";

interface AirwallexSettingsProps {
  companyId: string;
  initialAccountId?: string;
}

const AirwallexSettings = ({ companyId, initialAccountId }: AirwallexSettingsProps) => {
  const { toast } = useToast();
  const [accountId, setAccountId] = useState(initialAccountId || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);

      const { error } = await supabase
        .from("companies")
        .update({
          airwallex_account_id: accountId,
        })
        .eq("id", companyId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Airwallex account ID saved successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <CardTitle>Airwallex Integration</CardTitle>
        </div>
        <CardDescription>
          Configure your Airwallex account to generate payment links for invoices
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Security Notice:</strong> Airwallex API keys are now managed centrally by administrators 
            via secure environment variables. This prevents unauthorized access to payment credentials.
            Only the Account ID is stored here as a non-sensitive identifier.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="airwallex_account_id">Account ID</Label>
          <Input
            id="airwallex_account_id"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            placeholder="Enter your Airwallex Account ID"
          />
          <p className="text-xs text-muted-foreground">
            This is your Airwallex account identifier (not a secret key)
          </p>
        </div>

        <div className="pt-2">
          <Button onClick={handleSave} disabled={saving || !accountId}>
            {saving ? "Saving..." : "Save Account ID"}
          </Button>
        </div>

        <div className="mt-4 p-3 bg-muted rounded-lg text-sm space-y-2">
          <p className="font-medium">Configuration Instructions:</p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            <li>Your administrator has configured the Airwallex API key securely</li>
            <li>Find your Account ID in your Airwallex dashboard → Settings</li>
            <li>Enter the Account ID above and click Save</li>
            <li>Payment links will now be generated for your invoices</li>
          </ol>
          <p className="text-xs text-muted-foreground pt-2">
            <strong>Note:</strong> If you need to update the API key, contact your system administrator 
            to update it in the secure environment configuration.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AirwallexSettings;