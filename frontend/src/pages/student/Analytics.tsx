import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProgressLineChart } from '@/components/charts/ProgressLineChart';
import { useMyGrowth } from '@/hooks/useAnalytics';
import { useMyEnrollments } from '@/hooks/useCourses';
import { useTopicLookup } from '@/hooks/useTopicLookup';
import { TrendingUp } from 'lucide-react';

export function StudentAnalyticsPage() {
  const { data: growth, isLoading } = useMyGrowth();
  const { data: enrollments } = useMyEnrollments();
  const { topicMap } = useTopicLookup(enrollments?.map((e) => e.courseId) ?? []);

  const topicIds = useMemo(
    () => Array.from(new Set(growth?.progressTimeline.map((p) => p.topicId) ?? [])),
    [growth]
  );
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const activeTopicId = selectedTopic || topicIds[0] || '';

  const timeline = (growth?.progressTimeline ?? [])
    .filter((p) => p.topicId === activeTopicId)
    .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
    .map((p) => ({
      date: new Date(p.recordedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      score: p.score,
    }));

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Analytics</p>
        <h1 className="mt-1 font-display text-3xl font-medium text-ink">Your growth over time</h1>
      </div>

      {isLoading && <Skeleton className="h-72" />}

      {!isLoading && topicIds.length === 0 && (
        <EmptyState
          icon={<TrendingUp className="size-8" strokeWidth={1.25} />}
          title="Not enough data yet"
          description="Complete a few practice quizzes and your progress timeline will show up here."
        />
      )}

      {topicIds.length > 0 && (
        <Card>
          <CardHeader
            title="Progress timeline"
            description="Knowledge Score for one topic over time."
            action={
              <Select
                value={activeTopicId}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="w-48"
              >
                {topicIds.map((id) => (
                  <option key={id} value={id}>
                    {topicMap.get(id)?.title ?? id.slice(-6)}
                  </option>
                ))}
              </Select>
            }
          />
          <CardContent>
            <ProgressLineChart data={timeline} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
