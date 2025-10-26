import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Shield, Smartphone, Mail } from "lucide-react";

interface TwoFactorSetupProps {
  enabled: boolean;
  method: string;
  onUpdate: () => void;
}

export const TwoFactorSetup = ({ enabled, method, onUpdate }: TwoFactorSetupProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [selectedMethod, setSelectedMethod] = useState(method || 'sms');

  const handleToggle2FA = async (newEnabled: boolean) => {
    if (!newEnabled) {
      // Disable 2FA
      try {
        setLoading(true);
        const { error } = await supabase
          .from('profiles')
          .update({ two_factor_enabled: false })
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

        if (error) throw error;

        toast({
          title: "2FA Disabled",
          description: "Two-factor authentication has been disabled",
        });
        onUpdate();
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    } else {
      // Enable 2FA - send verification code
      await sendVerificationCode();
    }
  };

  const sendVerificationCode = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('send-2fa-code', {
        body: { method: selectedMethod },
      });

      if (error) throw error;

      setCodeSent(true);
      toast({
        title: "Code Sent",
        description: `A verification code has been sent to your ${selectedMethod === 'sms' ? 'phone' : 'email'}`,
      });
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

  const verifyCode = async () => {
    try {
      setVerifying(true);
      const { data, error } = await supabase.functions.invoke('verify-2fa-code', {
        body: { code: verificationCode },
      });

      if (error) throw error;

      if (data.success) {
        // Enable 2FA in profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            two_factor_enabled: true,
            two_factor_method: selectedMethod,
          })
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

        if (updateError) throw updateError;

        toast({
          title: "2FA Enabled",
          description: "Two-factor authentication is now enabled",
        });

        setCodeSent(false);
        setVerificationCode("");
        onUpdate();
      } else {
        toast({
          title: "Invalid Code",
          description: "The verification code is invalid or expired",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Two-Factor Authentication
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">Enable 2FA</p>
            <p className="text-xs text-muted-foreground">
              Add an extra layer of security to your account
            </p>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={handleToggle2FA}
            disabled={loading}
          />
        </div>

        {!enabled && !codeSent && (
          <div className="space-y-4 pt-4 border-t">
            <Label>Verification Method</Label>
            <div className="grid gap-3">
              <Button
                variant={selectedMethod === 'sms' ? 'default' : 'outline'}
                className="justify-start"
                onClick={() => setSelectedMethod('sms')}
              >
                <Smartphone className="w-4 h-4 mr-2" />
                SMS / Text Message
              </Button>
              <Button
                variant={selectedMethod === 'email' ? 'default' : 'outline'}
                className="justify-start"
                onClick={() => setSelectedMethod('email')}
              >
                <Mail className="w-4 h-4 mr-2" />
                Email
              </Button>
            </div>
          </div>
        )}

        {codeSent && (
          <div className="space-y-4 pt-4 border-t">
            <div>
              <Label htmlFor="code">Verification Code</Label>
              <Input
                id="code"
                type="text"
                placeholder="Enter 6-digit code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                maxLength={6}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={verifyCode}
                disabled={verifying || verificationCode.length !== 6}
              >
                Verify Code
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setCodeSent(false);
                  setVerificationCode("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {enabled && (
          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-green-600">
              <Shield className="w-4 h-4" />
              <span>2FA is enabled via {method}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
