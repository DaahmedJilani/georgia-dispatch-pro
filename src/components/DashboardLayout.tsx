import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Package,
  Users,
  Truck,
  Building2,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  DollarSign,
  MapPin,
  Navigation,
  UserCog,
} from "lucide-react";
import { cn } from "@/lib/utils";
import fleetLogo from "@/assets/fleet-logo.png";
import { useUserRole } from "@/hooks/useUserRole";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const { role, isMasterAdmin } = useUserRole();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (!session) {
          navigate("/auth");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      } else {
        // Fetch user profile
        setTimeout(() => {
          fetchProfile(session.user.id);
        }, 0);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*, companies(*)")
      .eq("user_id", userId)
      .single();
    setProfile(data);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  // Role-based navigation items
  const getNavItems = () => {
    const baseItems = [
      { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard", roles: ['admin', 'sales', 'dispatcher', 'treasury'] },
    ];

    // Master Admin gets everything plus Companies
    if (isMasterAdmin) {
      return [
        { icon: LayoutDashboard, label: "Master Admin", path: "/master-admin", roles: [] },
        { icon: Building2, label: "Companies", path: "/companies", roles: [] },
        { icon: Package, label: "Loads", path: "/loads", roles: [] },
        { icon: Truck, label: "Drivers", path: "/drivers", roles: [] },
        { icon: Users, label: "Brokers", path: "/brokers", roles: [] },
        { icon: Building2, label: "Carriers", path: "/carriers", roles: [] },
        { icon: FileText, label: "Documents", path: "/documents", roles: [] },
        { icon: DollarSign, label: "Invoices", path: "/invoices", roles: [] },
        { icon: BarChart3, label: "Analytics", path: "/analytics", roles: [] },
        { icon: Settings, label: "Settings", path: "/settings", roles: [] },
      ];
    }

    // Admin gets team management
    if (role === 'admin') {
      return [
        { icon: LayoutDashboard, label: "Dashboard", path: "/admin-dashboard", roles: [] },
        { icon: UserCog, label: "Team", path: "/team", roles: [] },
        { icon: Package, label: "Loads", path: "/loads", roles: [] },
        { icon: Truck, label: "Drivers", path: "/drivers", roles: [] },
        { icon: Users, label: "Brokers", path: "/brokers", roles: [] },
        { icon: Building2, label: "Carriers", path: "/carriers", roles: [] },
        { icon: FileText, label: "Documents", path: "/documents", roles: [] },
        { icon: DollarSign, label: "Invoices", path: "/invoices", roles: [] },
        { icon: BarChart3, label: "Analytics", path: "/analytics", roles: [] },
        { icon: Settings, label: "Settings", path: "/settings", roles: [] },
      ];
    }

    // Sales Agent
    if (role === 'sales') {
      return [
        { icon: LayoutDashboard, label: "Dashboard", path: "/sales-dashboard", roles: [] },
        { icon: Package, label: "My Loads", path: "/loads", roles: [] },
        { icon: Building2, label: "Carriers", path: "/carriers", roles: [] },
        { icon: Truck, label: "Drivers", path: "/drivers", roles: [] },
        { icon: FileText, label: "Documents", path: "/documents", roles: [] },
        { icon: BarChart3, label: "My Performance", path: "/analytics", roles: [] },
        { icon: Settings, label: "Settings", path: "/settings", roles: [] },
      ];
    }

    // Dispatcher
    if (role === 'dispatcher') {
      return [
        { icon: LayoutDashboard, label: "Dashboard", path: "/dispatch-dashboard", roles: [] },
        { icon: Package, label: "Loads", path: "/loads", roles: [] },
        { icon: Truck, label: "Drivers", path: "/drivers", roles: [] },
        { icon: MapPin, label: "Map", path: "/map", roles: [] },
        { icon: FileText, label: "Documents", path: "/documents", roles: [] },
        { icon: Settings, label: "Settings", path: "/settings", roles: [] },
      ];
    }

    // Treasury
    if (role === 'treasury') {
      return [
        { icon: LayoutDashboard, label: "Dashboard", path: "/treasury-dashboard", roles: [] },
        { icon: DollarSign, label: "Invoices", path: "/invoices", roles: [] },
        { icon: BarChart3, label: "Reports", path: "/analytics", roles: [] },
        { icon: Settings, label: "Settings", path: "/settings", roles: [] },
      ];
    }

    // Default fallback
    return baseItems;
  };

  const navItems = getNavItems();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Truck className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-primary text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={fleetLogo} alt="Fleet Logo" className="w-8 h-8" />
          <span className="font-semibold">Fleet</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-white hover:bg-white/10"
        >
          {sidebarOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar transition-transform duration-300 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-6 border-b border-sidebar-border">
            <img 
              src={fleetLogo} 
              alt="Fleet by Georgia Industrials" 
              className="w-12 h-12 object-contain"
            />
            <div>
              <h1 className="text-lg font-semibold text-sidebar-foreground">Fleet</h1>
              <p className="text-xs text-sidebar-foreground/60">by Georgia Industrials</p>
            </div>
          </div>

          {/* Company Info */}
          {profile?.companies && (
            <div className="px-6 py-4 border-b border-sidebar-border">
              <p className="text-sm font-medium text-sidebar-foreground">{profile.companies.name}</p>
              <p className="text-xs text-sidebar-foreground/60">
                {profile.first_name} {profile.last_name}
              </p>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = window.location.pathname === item.path;
              return (
                <Button
                  key={item.path}
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 transition-smooth",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                  )}
                  onClick={() => {
                    navigate(item.path);
                    setSidebarOpen(false);
                  }}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Button>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-3 border-t border-sidebar-border">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent/50"
              onClick={handleSignOut}
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 lg:pt-0">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
};

export default DashboardLayout;
