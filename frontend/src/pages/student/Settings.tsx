import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export function StudentSettingsPage() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <p className="eyebrow">Settings</p>
        <h1 className="mt-1 font-display text-3xl font-medium text-ink">Settings</h1>
      </div>

      <Card>
        <CardHeader title="Appearance" description="Choose how ModEd.ai looks on this device." />
        <CardContent>
          <ThemeToggle />
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Password" />
        <CardContent>
          <p className="text-sm text-ink-muted">
            To change your password, we'll email you a reset link.
          </p>
          <Link to="/forgot-password" className="mt-2 inline-block text-sm font-medium text-board hover:underline">
            Send password reset email
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
