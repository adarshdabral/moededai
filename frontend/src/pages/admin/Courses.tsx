import { useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SearchInput } from '@/components/ui/SearchInput';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { useCourses } from '@/hooks/useCourses';

export function AdminCoursesPage() {
  const [page, setPage] = useState(1);
  const [subject, setSubject] = useState('');
  const { data, isLoading } = useCourses({ page, limit: 20, subject: subject || undefined });

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Courses</p>
        <h1 className="mt-1 font-display text-3xl font-medium text-ink">All courses</h1>
      </div>

      <SearchInput
        placeholder="Filter by subject..."
        value={subject}
        onChange={(e) => {
          setSubject(e.target.value);
          setPage(1);
        }}
        className="max-w-xs"
      />

      {isLoading && <Skeleton className="h-64" />}
      {!isLoading && data?.items.length === 0 && (
        <EmptyState icon={<GraduationCap className="size-8" strokeWidth={1.25} />} title="No courses found" />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data?.items.map((course) => (
          <Link key={course.id} to={`/admin/courses/${course.id}`}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge variant="board">{course.subject}</Badge>
                  <Badge variant={course.isPublished ? 'correct' : 'neutral'}>
                    {course.isPublished ? 'Published' : 'Draft'}
                  </Badge>
                </div>
                <h3 className="mt-2 font-display text-lg font-medium text-ink">{course.title}</h3>
                <p className="mt-1 text-xs text-ink-faint">{course.gradeLevel}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {data?.pagination && <Pagination meta={data.pagination} onPageChange={setPage} />}
    </div>
  );
}
