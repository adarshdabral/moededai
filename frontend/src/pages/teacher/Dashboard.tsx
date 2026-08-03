import { Link } from 'react-router-dom';
import { GraduationCap, Users } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { useMe } from '@/hooks/useUser';
import { useMyClasses } from '@/hooks/useTeacher';
import { useNotifications } from '@/hooks/useNotifications';

export function TeacherDashboardPage() {
  const { data: user } = useMe();
  const { data: classes, isLoading } = useMyClasses();
  const { data: notifications } = useNotifications();

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Dashboard</p>
        <h1 className="mt-1 font-display text-3xl font-medium text-ink">
          Welcome back{user ? `, ${user.name.split(' ')[0]}` : ''}
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <p className="eyebrow mb-3">Your classes</p>
          {isLoading && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
            </div>
          )}
          {!isLoading && classes?.length === 0 && (
            <EmptyState
              icon={<GraduationCap className="size-8" strokeWidth={1.25} />}
              title="No classes yet"
              description="Create a course to get started."
              action={
                <Link
                  to="/teacher/courses"
                  className="inline-flex h-9 items-center rounded-md bg-board px-4 text-sm font-medium text-paper hover:bg-board-strong"
                >
                  Create a course
                </Link>
              }
            />
          )}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {classes?.map((course) => (
              <Link key={course.id} to={`/teacher/courses/${course.id}`}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Badge variant="board">{course.subject}</Badge>
                      {!course.isPublished && <Badge variant="neutral">Draft</Badge>}
                    </div>
                    <h3 className="mt-2 font-display text-lg font-medium text-ink">{course.title}</h3>
                    <p className="mt-1 text-xs text-ink-faint">{course.gradeLevel}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        <Card>
          <CardHeader title="Recent activity" />
          <CardContent>
            {notifications?.items.length === 0 && <p className="text-sm text-ink-muted">Nothing new.</p>}
            <ul className="divide-y divide-border">
              {notifications?.items.slice(0, 5).map((n) => (
                <li key={n.id} className="py-2.5">
                  <p className="text-sm text-ink">{n.title}</p>
                  <p className="text-xs text-ink-faint">{new Date(n.createdAt).toLocaleDateString()}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Link to="/teacher/students" className="inline-flex items-center gap-1.5 text-sm font-medium text-board hover:underline">
        <Users className="size-4" />
        View all students
      </Link>
    </div>
  );
}
