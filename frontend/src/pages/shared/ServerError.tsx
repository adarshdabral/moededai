import { AlertTriangle } from 'lucide-react';
import { StatusPage } from './StatusPage';

export function ServerErrorPage() {
  return (
    <StatusPage
      code="500"
      icon={<AlertTriangle className="size-14" strokeWidth={1.25} />}
      title="Something went wrong on our end"
      description="We've logged the issue. Try again in a moment — if it keeps happening, let your admin know."
      action={{ label: 'Go home', to: '/' }}
    />
  );
}
