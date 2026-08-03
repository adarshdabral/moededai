import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { useNotifications } from '@/hooks/useNotifications';

export function AssessmentsPage() {
  const [assessmentId, setAssessmentId] = useState('');
  const navigate = useNavigate();
  const { data: notifications } = useNotifications();

  const reminders = notifications?.items.filter((n) => n.type === 'test_reminder') ?? [];

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Monthly Assessments</p>
        <h1 className="mt-1 font-display text-3xl font-medium text-ink">Assessments</h1>
        <p className="mt-1 max-w-xl text-sm text-ink-muted">
          When your teacher opens a monthly assessment, you'll get a notification here with a
          link. You can also open one directly if you already have its ID.
        </p>
      </div>

      <Card>
        <CardHeader title="Open an assessment" />
        <CardContent>
          <form
            className="flex items-end gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (assessmentId.trim()) navigate(`/student/assessments/${assessmentId.trim()}`);
            }}
          >
            <div className="flex-1">
              <Label htmlFor="assessmentId">Assessment ID</Label>
              <Input
                id="assessmentId"
                value={assessmentId}
                onChange={(e) => setAssessmentId(e.target.value)}
                placeholder="e.g. 66f1a2b3c4d5e6f7a8b9c0d1"
              />
            </div>
            <Button type="submit">Open</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Recent reminders" />
        <CardContent>
          {reminders.length === 0 && (
            <EmptyState
              icon={<ClipboardList className="size-8" strokeWidth={1.25} />}
              title="No assessment reminders yet"
              description="Reminders show up here as soon as your teacher schedules one."
            />
          )}
          <ul className="divide-y divide-border">
            {reminders.map((n) => (
              <li key={n.id} className="py-3">
                <p className="text-sm font-medium text-ink">{n.title}</p>
                <p className="mt-0.5 text-sm text-ink-muted">{n.body}</p>
                <p className="mt-1 text-xs text-ink-faint">{new Date(n.createdAt).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
