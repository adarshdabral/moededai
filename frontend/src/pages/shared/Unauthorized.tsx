import { LogIn } from 'lucide-react';
import { StatusPage } from './StatusPage';

export function UnauthorizedPage() {
  return (
    <StatusPage
      code="401"
      icon={<LogIn className="size-14" strokeWidth={1.25} />}
      title="Your session has expired"
      description="Log in again to keep going — nothing you were working on has been lost."
      action={{ label: 'Log in', to: '/login' }}
    />
  );
}
