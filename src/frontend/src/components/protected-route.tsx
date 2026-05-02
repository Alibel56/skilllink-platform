import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth-store';
import type { UserRole } from '@/types/api';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: UserRole[];
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { token, user } = useAuth();
  const location = useLocation();

  if (!token) {
    const from = location.pathname + location.search + location.hash;
    return <Navigate to="/login" state={{ from }} replace />;
  }
  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
