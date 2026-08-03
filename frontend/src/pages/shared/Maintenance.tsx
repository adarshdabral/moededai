import { Wrench } from 'lucide-react';
import { StatusPage } from './StatusPage';

export function MaintenancePage() {
  return (
    <StatusPage
      icon={<Wrench className="size-14" strokeWidth={1.25} />}
      title="ModEd.ai is down for maintenance"
      description="We're making some improvements and will be back shortly. Thanks for your patience."
    />
  );
}
