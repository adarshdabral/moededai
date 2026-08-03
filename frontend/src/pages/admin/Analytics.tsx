import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { MagnitudeBarChart } from '@/components/charts/MagnitudeBarChart';
import { useAdminUsers } from '@/hooks/useAdmin';
import { useCourses } from '@/hooks/useCourses';

export function AdminAnalyticsPage() {
  const { data: students, isLoading: l1 } = useAdminUsers({ role: 'student', limit: 1 });
  const { data: teachers, isLoading: l2 } = useAdminUsers({ role: 'teacher', limit: 1 });
  const { data: admins, isLoading: l3 } = useAdminUsers({ role: 'admin', limit: 1 });
  const { data: published } = useCourses({ limit: 1 });
  const isLoading = l1 || l2 || l3;

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Analytics</p>
        <h1 className="mt-1 font-display text-3xl font-medium text-ink">Platform analytics</h1>
      </div>

      <Card>
        <CardHeader title="Users by role" />
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64" />
          ) : (
            <MagnitudeBarChart
              data={[
                { label: 'Students', value: students?.pagination.total ?? 0 },
                { label: 'Teachers', value: teachers?.pagination.total ?? 0 },
                { label: 'Admins', value: admins?.pagination.total ?? 0 },
              ]}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <p className="text-sm text-ink-muted">
            <span className="font-mono text-ink">{published?.pagination.total ?? 0}</span> published
            courses platform-wide. For per-class performance, open a course from{' '}
            <span className="font-medium">Courses</span> and review its comparative report from
            the Teacher Portal (Reports tab is teacher-scoped by design).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
