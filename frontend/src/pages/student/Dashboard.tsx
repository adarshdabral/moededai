import { Link } from 'react-router-dom';
import { Flame, MessageSquare, Sparkles, TriangleAlert } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { KnowledgeScoreGauge } from '@/components/knowledge-score/KnowledgeScoreGauge';
import { useMe } from '@/hooks/useUser';
import { useMyGrowth } from '@/hooks/useAnalytics';
import { useMyWeakTopics } from '@/hooks/useKnowledgeScore';
import { useConversations } from '@/hooks/useAiTutor';
import { useMyEnrollments } from '@/hooks/useCourses';
import { useTopicLookup } from '@/hooks/useTopicLookup';

export function StudentDashboardPage() {
  const { data: user } = useMe();
  const { data: growth, isLoading: growthLoading } = useMyGrowth();
  const { data: weakTopics, isLoading: weakLoading } = useMyWeakTopics();
  const { data: conversations, isLoading: conversationsLoading } = useConversations();
  const { data: enrollments } = useMyEnrollments();
  const { topicMap } = useTopicLookup(enrollments?.map((e) => e.courseId) ?? []);

  const overallScore = growth?.topicMastery.length
    ? Math.round(growth.topicMastery.reduce((sum, t) => sum + t.currentScore, 0) / growth.topicMastery.length)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Dashboard</p>
        <h1 className="mt-1 font-display text-3xl font-medium text-ink">
          Welcome back{user ? `, ${user.name.split(' ')[0]}` : ''}
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="flex flex-col items-center justify-center gap-4 p-6 lg:col-span-1">
          {growthLoading ? (
            <Skeleton className="size-36 rounded-full" />
          ) : (
            <KnowledgeScoreGauge score={overallScore} label="Overall Knowledge Score" size="lg" />
          )}
          <div className="flex items-center gap-1.5 rounded-full bg-gold-soft px-3 py-1 text-sm font-medium text-gold-strong">
            <Flame className="size-4" />
            {growth?.learningStreakDays ?? 0} day streak
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Topics to review"
            description="Your lowest-scoring topics, weakest first."
            action={
              <Link to="/student/knowledge-score" className="text-sm font-medium text-board hover:underline">
                View all
              </Link>
            }
          />
          <CardContent>
            {weakLoading && (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            )}
            {!weakLoading && weakTopics?.length === 0 && (
              <EmptyState
                icon={<Sparkles className="size-8" strokeWidth={1.25} />}
                title="Nothing weak to report"
                description="Every topic you've been tested on is at 60 or above. Keep it up."
              />
            )}
            <ul className="divide-y divide-border">
              {weakTopics?.slice(0, 5).map((t) => (
                <li key={t.topicId} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-2">
                    <TriangleAlert className="size-4 text-flag" />
                    <span className="text-sm text-ink">
                      {topicMap.get(t.topicId)?.title ?? 'Topic'}
                    </span>
                  </div>
                  <Badge variant="flag">{t.currentScore}/100</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Recent AI conversations"
          action={
            <Link to="/student/ai-tutor" className="text-sm font-medium text-board hover:underline">
              Open AI Tutor
            </Link>
          }
        />
        <CardContent>
          {conversationsLoading && (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          )}
          {!conversationsLoading && conversations?.items.length === 0 && (
            <EmptyState
              icon={<MessageSquare className="size-8" strokeWidth={1.25} />}
              title="No conversations yet"
              description="Ask the AI Tutor anything about what you're studying."
              action={
                <Link
                  to="/student/ai-tutor"
                  className="inline-flex h-9 items-center rounded-md bg-board px-4 text-sm font-medium text-paper hover:bg-board-strong"
                >
                  Start a conversation
                </Link>
              }
            />
          )}
          <ul className="divide-y divide-border">
            {conversations?.items.slice(0, 5).map((c) => (
              <li key={c.id}>
                <Link
                  to={`/student/ai-tutor/${c.id}`}
                  className="flex items-center justify-between py-2.5 text-sm hover:text-board"
                >
                  <span className="truncate text-ink">{c.title}</span>
                  <span className="shrink-0 text-xs text-ink-faint">
                    {new Date(c.lastMessageAt).toLocaleDateString()}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
