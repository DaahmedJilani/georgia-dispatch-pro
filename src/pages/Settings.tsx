import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import AirwallexSettings from "@/components/settings/AirwallexSettings";
import { TwoFactorSetup } from "@/components/auth/TwoFactorSetup";
import { AnalyticsExport } from "@/components/analytics/AnalyticsExport";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { formatDate, formatCurrency, getStatusBadgeVariant } from "@/lib/subscription-utils";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string>("");
  const [airwallexAccountId, setAirwallexAccountId] = useState<string>("");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorMethod, setTwoFactorMethod] = useState("sms");
  const subscription = useSubscriptionStatus();
  const { role: userRole, isMasterAdmin } = useUserRole();
  const [profile, setProfile] = useState({
    first_name: "",
    last_name: "",
    phone: "",
  });
  const [company, setCompany] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    checkAuth();
    fetchSettings();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (profileData) {
        setProfile({
          first_name: profileData.first_name || "",
          last_name: profileData.last_name || "",
          phone: profileData.phone || "",
        });
        setTwoFactorEnabled(profileData.two_factor_enabled || false);
        setTwoFactorMethod(profileData.two_factor_method || "sms");

        if (profileData.company_id) {
          setCompanyId(profileData.company_id);
          
          const { data: companyData } = await supabase
            .from("companies")
            .select("*")
            .eq("id", profileData.company_id)
            .single();

          if (companyData) {
            setCompany({
              name: companyData.name || "",
              email: companyData.email || "",
              phone: companyData.phone || "",
              address: companyData.address || "",
            });
            setAirwallexAccountId(companyData.airwallex_account_id || "");
          }
        }
      }
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

  const handleSaveProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update(profile)
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account and company settings</p>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading settings...</div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      value={profile.first_name}
                      onChange={(e) =>
                        setProfile({ ...profile, first_name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      value={profile.last_name}
                      onChange={(e) =>
                        setProfile({ ...profile, last_name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={profile.phone}
                      onChange={(e) =>
                        setProfile({ ...profile, phone: e.target.value })
                      }
                    />
                  </div>
                  <Button onClick={handleSaveProfile}>Save Changes</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Company Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="company_name">Company Name</Label>
                    <Input
                      id="company_name"
                      value={company.name}
                      disabled
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company_email">Email</Label>
                    <Input
                      id="company_email"
                      value={company.email}
                      disabled
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company_phone">Phone</Label>
                    <Input
                      id="company_phone"
                      value={company.phone}
                      disabled
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company_address">Address</Label>
                    <Input
                      id="company_address"
                      value={company.address}
                      disabled
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Subscription Status (for Company Admins) */}
            {userRole === 'admin' && !isMasterAdmin && (
              <Card>
                <CardHeader>
                  <CardTitle>Subscription Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {subscription.loading ? (
                    <div className="text-center py-4">Loading subscription status...</div>
                  ) : (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Status:</span>
                        <Badge variant={getStatusBadgeVariant(subscription.status || 'pending')}>
                          {subscription.status}
                        </Badge>
                      </div>
                      {subscription.dueDate && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Next Payment Due:</span>
                          <span className="font-semibold">{formatDate(subscription.dueDate)}</span>
                        </div>
                      )}
                      {subscription.amount && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Amount:</span>
                          <span className="font-semibold">{formatCurrency(subscription.amount)}</span>
                        </div>
                      )}
                      {subscription.lastPayment && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Last Payment:</span>
                          <span>{formatDate(subscription.lastPayment)}</span>
                        </div>
                      )}
                      {subscription.status === 'suspended' && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Access Suspended</AlertTitle>
                          <AlertDescription>
                            Your company's access has been suspended due to non-payment. 
                            Please contact the master administrator to resolve this issue.
                          </AlertDescription>
                        </Alert>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="grid gap-6 md:grid-cols-2">
              <TwoFactorSetup
                enabled={twoFactorEnabled}
                method={twoFactorMethod}
                onUpdate={fetchSettings}
              />

              {userRole !== 'driver' && <AnalyticsExport />}
            </div>

            {companyId && userRole === 'admin' && (
              <AirwallexSettings
                companyId={companyId}
                initialAccountId={airwallexAccountId}
              />
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Settings;
