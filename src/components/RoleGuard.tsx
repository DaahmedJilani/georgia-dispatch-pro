import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';

interface RoleGuardProps {
  allowedRoles: string[];
  children: ReactNode;
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { role, isMasterAdmin, loading } = useUserRole();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Master admin has access to everything
  if (isMasterAdmin) {
    return <>{children}</>;
  }

  // Check if user's role is in allowed roles
  if (role && allowedRoles.includes(role)) {
    return <>{children}</>;
  }

  // Redirect to appropriate dashboard based on role
  const redirectPath = role === 'admin' ? '/admin-dashboard' 
    : role === 'sales' ? '/sales-dashboard'
    : role === 'dispatcher' ? '/dispatch-dashboard'
    : role === 'treasury' ? '/treasury-dashboard'
    : '/driver-portal';

  return <Navigate to={redirectPath} replace />;
}
