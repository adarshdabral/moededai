import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { MagnitudeBarChart } from '@/components/charts/MagnitudeBarChart';
import { KnowledgeScoreGauge } from '@/components/knowledge-score/KnowledgeScoreGauge';
import { useMyScores } from '@/hooks/useKnowledgeScore';
import { useMyEnrollments } from '@/hooks/useCourses';
import { useTopicLookup } from '@/hooks/useTopicLookup';
import { Gauge } from 'lucide-react';

export function KnowledgeScorePage() {
  const { data: scores, isLoading } = useMyScores();
  const { data: enrollments } = useMyEnrollments();
  const { topicMap } = useTopicLookup(enrollments?.map((e) => e.courseId) ?? []);

  const overall = scores?.length
    ? Math.round(scores.reduce((sum, s) => sum + s.currentScore, 0) / scores.length)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Knowledge Score</p>
        <h1 className="mt-1 font-display text-3xl font-medium text-ink">Your mastery, by topic</h1>
      </div>

      {isLoading && <Skeleton className="h-64" />}

      {!isLoading && scores?.length === 0 && (
        <EmptyState
          icon={<Gauge className="size-8" strokeWidth={1.25} />}
          title="No scores yet"
          description="Take a practice quiz or assessment to start building your Knowledge Score."
        />
      )}

      {scores && scores.length > 0 && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <Card className="flex flex-col items-center justify-center gap-2 p-6">
            <KnowledgeScoreGauge score={overall} label="Overall" size="lg" />
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader title="Score by topic" />
            <CardContent>
              <MagnitudeBarChart
                data={scores.map((s) => ({
                  label: topicMap.get(s.topicId)?.title ?? s.topicId.slice(-6),
                  value: s.currentScore,
                }))}
                warnBelow={60}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {scores && scores.length > 0 && (
        <Card>
          <CardHeader title="All topics" />
          <CardContent>
            <ul className="divide-y divide-border">
              {scores
                .sort((a, b) => a.currentScore - b.currentScore)
                .map((s) => (
                  <li key={s.topicId} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-ink">
                        {topicMap.get(s.topicId)?.title ?? 'Topic'}
                      </p>
                      <p className="text-xs text-ink-faint">{s.attemptsCount} attempts</p>
                    </div>
                    <KnowledgeScoreGauge score={s.currentScore} size="sm" />
                  </li>
                ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
