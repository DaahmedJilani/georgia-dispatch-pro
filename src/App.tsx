import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import MasterAdminDashboard from "./pages/MasterAdminDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import SalesDashboard from "./pages/SalesDashboard";
import DispatchDashboard from "./pages/DispatchDashboard";
import TreasuryDashboard from "./pages/TreasuryDashboard";
import TeamManagement from "./pages/TeamManagement";
import CompaniesManagement from "./pages/CompaniesManagement";
import Loads from "./pages/Loads";
import Drivers from "./pages/Drivers";
import Brokers from "./pages/Brokers";
import Carriers from "./pages/Carriers";
import Documents from "./pages/Documents";
import Invoices from "./pages/Invoices";
import Map from "./pages/Map";
import DriverPortal from "./pages/DriverPortal";
import CarrierPortal from "./pages/CarrierPortal";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import { RoleGuard } from "./components/RoleGuard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* Role-Specific Dashboards */}
          <Route path="/master-admin" element={<RoleGuard allowedRoles={['master_admin']}><MasterAdminDashboard /></RoleGuard>} />
          <Route path="/admin-dashboard" element={<RoleGuard allowedRoles={['admin']}><AdminDashboard /></RoleGuard>} />
          <Route path="/sales-dashboard" element={<RoleGuard allowedRoles={['sales']}><SalesDashboard /></RoleGuard>} />
          <Route path="/dispatch-dashboard" element={<RoleGuard allowedRoles={['dispatcher']}><DispatchDashboard /></RoleGuard>} />
          <Route path="/treasury-dashboard" element={<RoleGuard allowedRoles={['treasury']}><TreasuryDashboard /></RoleGuard>} />
          
          {/* Management Pages */}
          <Route path="/team" element={<RoleGuard allowedRoles={['admin']}><TeamManagement /></RoleGuard>} />
          <Route path="/companies" element={<RoleGuard allowedRoles={['master_admin']}><CompaniesManagement /></RoleGuard>} />
          
          {/* Shared Pages */}
          <Route path="/loads" element={<Loads />} />
          <Route path="/drivers" element={<Drivers />} />
          <Route path="/brokers" element={<Brokers />} />
          <Route path="/carriers" element={<Carriers />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/map" element={<Map />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
          
          {/* Portals */}
          <Route path="/driver-portal" element={<DriverPortal />} />
          <Route path="/carrier-portal" element={<CarrierPortal />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
