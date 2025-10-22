import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Eye, EyeOff } from "lucide-react";

interface AirwallexSettingsProps {
  companyId: string;
  initialApiKey?: string;
  initialAccountId?: string;
}

const AirwallexSettings = ({ companyId, initialApiKey, initialAccountId }: AirwallexSettingsProps) => {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState(initialApiKey || "");
  const [accountId, setAccountId] = useState(initialAccountId || "");
  const [showApiKey, setShowApiKey] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);

      const { error } = await supabase
        .from("companies")
        .update({
          airwallex_api_key: apiKey,
          airwallex_account_id: accountId,
        })
        .eq("id", companyId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Airwallex credentials saved successfully",
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
          Connect your Airwallex account to generate payment links for invoices
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="airwallex_api_key">API Key</Label>
          <div className="relative">
            <Input
              id="airwallex_api_key"
              type={showApiKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Airwallex API key"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setShowApiKey(!showApiKey)}
            >
              {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Your API key is encrypted and securely stored
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="airwallex_account_id">Account ID</Label>
          <Input
            id="airwallex_account_id"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            placeholder="Enter your Airwallex Account ID"
          />
        </div>

        <div className="pt-2">
          <Button onClick={handleSave} disabled={saving || !apiKey || !accountId}>
            {saving ? "Saving..." : "Save Credentials"}
          </Button>
        </div>

        <div className="mt-4 p-3 bg-muted rounded-lg text-sm">
          <p className="font-medium mb-1">How to find your credentials:</p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            <li>Log into your Airwallex dashboard</li>
            <li>Navigate to Settings → API Keys</li>
            <li>Create or copy your API key</li>
            <li>Find your Account ID in the account settings</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default AirwallexSettings;