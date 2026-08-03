import { ShieldAlert } from 'lucide-react';
import { StatusPage } from './StatusPage';

export function ForbiddenPage() {
  return (
    <StatusPage
      code="403"
      icon={<ShieldAlert className="size-14" strokeWidth={1.25} />}
      title="You don't have access to this"
      description="This area is restricted to a different role. If you think that's wrong, check with your admin."
      action={{ label: 'Go home', to: '/' }}
    />
  );
}
