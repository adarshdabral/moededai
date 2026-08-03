import { Link, useNavigate, useParams } from 'react-router-dom';
import { Check, Sparkles, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { KnowledgeScoreGauge } from '@/components/knowledge-score/KnowledgeScoreGauge';
import { useAttempt, useTest } from '@/hooks/useAiTest';
import { useStartConversation } from '@/hooks/useAiTutor';

export function AttemptResultPage() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const { data: attempt, isLoading } = useAttempt(attemptId);
  const { data: test } = useTest(attempt?.testId);
  const startConversation = useStartConversation();

  if (isLoading || !attempt) return <Skeleton className="h-96" />;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card className="flex flex-col items-center gap-3 p-8 text-center">
        <KnowledgeScoreGauge score={attempt.score} label="Your score" size="lg" />
        {attempt.weakTopicsIdentified.length > 0 && (
          <p className="text-sm text-ink-muted">
            This attempt flagged{' '}
            {attempt.weakTopicsIdentified.map((t) => (
              <Badge key={t} variant="flag" className="mx-1">
                {t}
              </Badge>
            ))}
            as an area to review.
          </p>
        )}
        <Button
          variant="gold"
          leftIcon={<Sparkles className="size-4" />}
          isLoading={startConversation.isPending}
          onClick={() =>
            startConversation.mutate(test?.topicId, {
              onSuccess: (c) => navigate(`/student/ai-tutor/${c.id}`),
            })
          }
        >
          Review with the AI Tutor
        </Button>
      </Card>

      <div className="space-y-3">
        {attempt.answers.map((answer, i) => (
          <Card key={i}>
            <CardContent>
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-ink">
                  {i + 1}. {test?.questions[i]?.prompt ?? 'Question'}
                </p>
                <Badge variant={answer.isCorrect ? 'correct' : 'flag'}>
                  {answer.isCorrect ? <Check className="size-3" /> : <X className="size-3" />}
                  {answer.pointsAwarded} pts
                </Badge>
              </div>
              <p className="mt-2 rounded-md bg-paper-sunken px-3 py-2 text-sm text-ink-muted">
                Your answer: {answer.response}
              </p>
              {!answer.isCorrect && (
                <p className="mt-2 text-xs text-ink-faint">
                  The model answer isn't shown here to keep future practice quizzes meaningful —
                  ask the AI Tutor if you want it explained.
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center">
        <Link to="/student/knowledge-score" className="text-sm font-medium text-board hover:underline">
          View your Knowledge Score
        </Link>
      </div>
    </div>
  );
}
