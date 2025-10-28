import { useUserRole } from './useUserRole';

interface NavItem {
  label: string;
  path: string;
  icon?: string;
}

export function useRoleNavigation() {
  const { role, isMasterAdmin } = useUserRole();

  const masterAdminNav: NavItem[] = [
    { label: 'Master Dashboard', path: '/master-admin' },
    { label: 'Companies', path: '/companies' },
    { label: 'Analytics', path: '/analytics' },
    { label: 'Settings', path: '/settings' },
  ];

  const adminNav: NavItem[] = [
    { label: 'Dashboard', path: '/admin-dashboard' },
    { label: 'Team', path: '/team' },
    { label: 'Loads', path: '/loads' },
    { label: 'Drivers', path: '/drivers' },
    { label: 'Carriers', path: '/carriers' },
    { label: 'Brokers', path: '/brokers' },
    { label: 'Documents', path: '/documents' },
    { label: 'Invoices', path: '/invoices' },
    { label: 'Fleet Map', path: '/fleet-map' },
    { label: 'Analytics', path: '/analytics' },
    { label: 'Audit Logs', path: '/audit-logs' },
    { label: 'Messages', path: '/messages' },
    { label: 'Settings', path: '/settings' },
  ];

  const salesNav: NavItem[] = [
    { label: 'Dashboard', path: '/sales-dashboard' },
    { label: 'Carriers', path: '/carriers' },
    { label: 'Drivers', path: '/drivers' },
    { label: 'Documents', path: '/documents' },
    { label: 'Messages', path: '/messages' },
    { label: 'Settings', path: '/settings' },
  ];

  const dispatcherNav: NavItem[] = [
    { label: 'Dashboard', path: '/dispatch-dashboard' },
    { label: 'Loads', path: '/loads' },
    { label: 'Drivers', path: '/drivers' },
    { label: 'Carriers', path: '/carriers' },
    { label: 'Documents', path: '/documents' },
    { label: 'Fleet Map', path: '/fleet-map' },
    { label: 'Messages', path: '/messages' },
    { label: 'Settings', path: '/settings' },
  ];

  const treasuryNav: NavItem[] = [
    { label: 'Dashboard', path: '/treasury-dashboard' },
    { label: 'Invoices', path: '/invoices' },
    { label: 'Documents', path: '/documents' },
    { label: 'Settings', path: '/settings' },
  ];

  const driverNav: NavItem[] = [
    { label: 'Dashboard', path: '/driver-portal' },
    { label: 'My Loads', path: '/loads' },
    { label: 'Documents', path: '/documents' },
    { label: 'Messages', path: '/messages' },
    { label: 'Settings', path: '/settings' },
  ];

  const getNavItems = (): NavItem[] => {
    if (isMasterAdmin) return masterAdminNav;
    if (role === 'admin') return adminNav;
    if (role === 'sales') return salesNav;
    if (role === 'dispatcher') return dispatcherNav;
    if (role === 'treasury') return treasuryNav;
    return driverNav;
  };

  const getDashboardPath = (): string => {
    if (isMasterAdmin) return '/master-admin';
    if (role === 'admin') return '/admin-dashboard';
    if (role === 'sales') return '/sales-dashboard';
    if (role === 'dispatcher') return '/dispatch-dashboard';
    if (role === 'treasury') return '/treasury-dashboard';
    return '/driver-portal';
  };

  return {
    navItems: getNavItems(),
    dashboardPath: getDashboardPath(),
    role,
    isMasterAdmin,
  };
}
