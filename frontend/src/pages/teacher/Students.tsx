import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAllMyStudents } from '@/hooks/useTeacher';

export function TeacherStudentsPage() {
  const { students, isLoading } = useAllMyStudents();

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Students</p>
        <h1 className="mt-1 font-display text-3xl font-medium text-ink">Your students</h1>
        <p className="mt-1 max-w-xl text-sm text-ink-muted">
          Identified by student ID — the platform doesn't expose student names to a roster view,
          only through each student's own dashboard.
        </p>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      )}

      {!isLoading && students.length === 0 && (
        <EmptyState
          icon={<Users className="size-8" strokeWidth={1.25} />}
          title="No students enrolled yet"
          description="Enroll students from a course's roster tab."
        />
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {students.map((s) => (
          <Link key={s.studentId} to={`/teacher/students/${s.studentId}`}>
            <Card className="h-full transition-shadow hover:shadow-sm">
              <CardContent className="flex items-center gap-3">
                <Avatar name={`Student ${s.studentId.slice(-4)}`} size="md" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">
                    Student #{s.studentId.slice(-6)}
                  </p>
                  <Badge variant="neutral" className="mt-1">
                    {s.courseIds.length} {s.courseIds.length === 1 ? 'course' : 'courses'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
