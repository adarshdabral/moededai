import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { MagnitudeBarChart } from '@/components/charts/MagnitudeBarChart';
import { useMyClasses } from '@/hooks/useTeacher';
import { useCourseComparative } from '@/hooks/useAnalytics';
import { BarChart3 } from 'lucide-react';

export function TeacherReportsPage() {
  const { data: classes } = useMyClasses();
  const [courseId, setCourseId] = useState('');
  const activeCourseId = courseId || classes?.[0]?.id;
  const { data: comparative, isLoading } = useCourseComparative(activeCourseId);

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Reports</p>
        <h1 className="mt-1 font-display text-3xl font-medium text-ink">Class performance</h1>
      </div>

      <Select value={activeCourseId ?? ''} onChange={(e) => setCourseId(e.target.value)} className="w-56">
        {classes?.map((c) => (
          <option key={c.id} value={c.id}>
            {c.title}
          </option>
        ))}
      </Select>

      <Card>
        <CardHeader title="Average Knowledge Score per student" />
        <CardContent>
          {isLoading && <Skeleton className="h-64" />}
          {!isLoading && comparative?.length === 0 && (
            <EmptyState
              icon={<BarChart3 className="size-8" strokeWidth={1.25} />}
              title="No data yet"
              description="Scores appear once enrolled students complete quizzes or assessments."
            />
          )}
          {comparative && comparative.length > 0 && (
            <MagnitudeBarChart
              data={comparative.map((c) => ({ label: `#${c.studentId.slice(-6)}`, value: c.averageScore }))}
              warnBelow={60}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
