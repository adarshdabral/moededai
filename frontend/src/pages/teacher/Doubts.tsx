import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircleQuestion } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useMyClasses } from '@/hooks/useTeacher';
import { useCourseDoubts } from '@/hooks/useDoubts';

const statusVariant = { open: 'gold', answered: 'correct', closed: 'neutral' } as const;

export function TeacherDoubtsPage() {
  const { data: classes } = useMyClasses();
  const [courseId, setCourseId] = useState<string>('');
  const [status, setStatus] = useState<'' | 'open' | 'answered' | 'closed'>('');
  const activeCourseId = courseId || classes?.[0]?.id;
  const { data: doubts, isLoading } = useCourseDoubts(activeCourseId, status || undefined);

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Anonymous Doubts</p>
        <h1 className="mt-1 font-display text-3xl font-medium text-ink">Doubt inbox</h1>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={activeCourseId ?? ''} onChange={(e) => setCourseId(e.target.value)} className="w-56">
          {classes?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="w-40">
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="answered">Answered</option>
          <option value="closed">Closed</option>
        </Select>
      </div>

      {isLoading && <Skeleton className="h-40" />}
      {!isLoading && doubts?.length === 0 && (
        <EmptyState
          icon={<MessageCircleQuestion className="size-8" strokeWidth={1.25} />}
          title="No doubts here"
          description="Anonymous questions from students in this course will show up here."
        />
      )}
      <div className="space-y-2">
        {doubts?.map((d) => (
          <Link key={d.id} to={`/teacher/doubts/${d.id}`}>
            <Card className="transition-shadow hover:shadow-sm">
              <CardContent className="flex items-start justify-between gap-3">
                <p className="text-sm text-ink">{d.question}</p>
                <Badge variant={statusVariant[d.status]}>{d.status}</Badge>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
