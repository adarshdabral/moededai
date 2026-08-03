import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAdminUsers, useAuditLogs } from '@/hooks/useAdmin';
import { useCourses } from '@/hooks/useCourses';

function StatCard({ label, value, isLoading }: { label: string; value: number; isLoading: boolean }) {
  return (
    <Card className="p-5">
      <p className="eyebrow">{label}</p>
      {isLoading ? <Skeleton className="mt-2 h-9 w-16" /> : <p className="mt-1 font-display text-4xl font-medium text-ink">{value}</p>}
    </Card>
  );
}

export function AdminDashboardPage() {
  const { data: students, isLoading: studentsLoading } = useAdminUsers({ role: 'student', limit: 1 });
  const { data: teachers, isLoading: teachersLoading } = useAdminUsers({ role: 'teacher', limit: 1 });
  const { data: admins, isLoading: adminsLoading } = useAdminUsers({ role: 'admin', limit: 1 });
  const { data: courses, isLoading: coursesLoading } = useCourses({ limit: 1 });
  const { data: auditLogs } = useAuditLogs(1);

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Dashboard</p>
        <h1 className="mt-1 font-display text-3xl font-medium text-ink">Platform overview</h1>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Students" value={students?.pagination.total ?? 0} isLoading={studentsLoading} />
        <StatCard label="Teachers" value={teachers?.pagination.total ?? 0} isLoading={teachersLoading} />
        <StatCard label="Admins" value={admins?.pagination.total ?? 0} isLoading={adminsLoading} />
        <StatCard label="Courses" value={courses?.pagination.total ?? 0} isLoading={coursesLoading} />
      </div>

      <Card>
        <CardHeader
          title="Recent audit activity"
          action={
            <Link to="/admin/audit-logs" className="text-sm font-medium text-board hover:underline">
              View all
            </Link>
          }
        />
        <CardContent>
          {auditLogs?.items.length === 0 && <p className="text-sm text-ink-muted">No activity yet.</p>}
          <ul className="divide-y divide-border">
            {auditLogs?.items.slice(0, 6).map((log) => (
              <li key={log.id} className="py-2.5 text-sm">
                <span className="font-medium text-ink">{log.action.replace(/_/g, ' ')}</span>
                <span className="text-ink-muted"> — {log.reason}</span>
                <p className="text-xs text-ink-faint">{new Date(log.createdAt).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
