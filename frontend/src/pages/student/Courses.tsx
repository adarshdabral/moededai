import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { useCourses } from '@/hooks/useCourses';
import { useMyEnrollments } from '@/hooks/useCourses';

export function StudentCoursesPage() {
  const { data, isLoading } = useCourses({ limit: 50 });
  const { data: enrollments } = useMyEnrollments();
  const enrolledCourseIds = new Set(enrollments?.map((e) => e.courseId));

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Courses</p>
        <h1 className="mt-1 font-display text-3xl font-medium text-ink">Your courses</h1>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      )}

      {!isLoading && data?.items.length === 0 && (
        <EmptyState
          icon={<BookOpen className="size-8" strokeWidth={1.25} />}
          title="No courses available yet"
          description="Once a teacher publishes a course, it'll show up here."
        />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data?.items.map((course) => (
          <Link key={course.id} to={`/student/courses/${course.id}`}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardContent className="flex h-full flex-col">
                <div className="flex items-start justify-between gap-2">
                  <Badge variant="board">{course.subject}</Badge>
                  {enrolledCourseIds.has(course.id) && <Badge variant="gold">Enrolled</Badge>}
                </div>
                <h3 className="mt-3 font-display text-lg font-medium text-ink">{course.title}</h3>
                {course.description && (
                  <p className="mt-1 line-clamp-2 flex-1 text-sm text-ink-muted">{course.description}</p>
                )}
                <p className="mt-3 text-xs text-ink-faint">{course.gradeLevel}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
