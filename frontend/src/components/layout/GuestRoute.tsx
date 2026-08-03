import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

/** Redirects an already-authenticated user away from auth pages (login/register). */
export function GuestRoute() {
  const user = useAuthStore((s) => s.user);
  if (user) return <Navigate to={`/${user.role}`} replace />;
  return <Outlet />;
}
