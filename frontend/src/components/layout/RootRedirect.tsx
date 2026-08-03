import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

export function RootRedirect() {
  const user = useAuthStore((s) => s.user);
  return <Navigate to={user ? `/${user.role}` : '/login'} replace />;
}
