import { useParams } from 'react-router-dom';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Avatar } from '@/components/ui/Avatar';
import { KnowledgeScoreGauge } from '@/components/knowledge-score/KnowledgeScoreGauge';
import { MagnitudeBarChart } from '@/components/charts/MagnitudeBarChart';
import { useStudentAnalytics } from '@/hooks/useTeacher';
import { Flame } from 'lucide-react';

export function StudentDetailPage() {
  const { studentId } = useParams();
  const { data: analytics, isLoading } = useStudentAnalytics(studentId);

  if (isLoading || !analytics) return <Skeleton className="h-96" />;

  const overall = analytics.topicMastery.length
    ? Math.round(analytics.topicMastery.reduce((s, t) => s + t.currentScore, 0) / analytics.topicMastery.length)
    : 0;

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Students', to: '/teacher/students' }, { label: `#${studentId?.slice(-6)}` }]} />

      <div className="flex items-center gap-3">
        <Avatar name={`Student ${studentId?.slice(-4)}`} size="lg" />
        <div>
          <h1 className="font-display text-2xl font-medium text-ink">Student #{studentId?.slice(-6)}</h1>
          <p className="flex items-center gap-1 text-sm text-ink-muted">
            <Flame className="size-3.5" /> {analytics.learningStreakDays} day streak
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="flex items-center justify-center p-6 lg:col-span-1">
          <KnowledgeScoreGauge score={overall} label="Overall" size="lg" />
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader title="Score by topic" />
          <CardContent>
            {analytics.topicMastery.length === 0 ? (
              <p className="text-sm text-ink-muted">No scores recorded yet.</p>
            ) : (
              <MagnitudeBarChart
                data={analytics.topicMastery.map((t) => ({ label: t.topicId.slice(-6), value: t.currentScore }))}
                warnBelow={60}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
