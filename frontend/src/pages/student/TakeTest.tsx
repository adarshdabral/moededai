import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAttempt, useSubmitAttempt, useTest } from '@/hooks/useAiTest';
import { toast } from '@/components/ui/toastStore';
import { getApiErrorMessage } from '@/api/client';
import { cn } from '@/lib/cn';

export function TakeTestPage() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const { data: attempt, isLoading: attemptLoading } = useAttempt(attemptId);
  const { data: test, isLoading: testLoading } = useTest(attempt?.testId);
  const submitAttempt = useSubmitAttempt();
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const deadline = useMemo(() => {
    if (!attempt || !test) return null;
    return new Date(attempt.startedAt).getTime() + test.timeLimitMinutes * 60_000;
  }, [attempt, test]);

  const [remainingMs, setRemainingMs] = useState<number | null>(null);

  useEffect(() => {
    if (!deadline) return;
    const tick = () => setRemainingMs(Math.max(0, deadline - Date.now()));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  if (attempt?.submittedAt) {
    return <Navigate to={`/student/attempts/${attemptId}`} replace />;
  }

  if (attemptLoading || testLoading || !test || !attempt) {
    return <Skeleton className="h-96" />;
  }

  function handleSubmit() {
    if (!attemptId) return;
    const payload = test!.questions.map((_, i) => ({ questionIndex: i, response: answers[i] ?? '' }));
    if (payload.some((a) => !a.response.trim())) {
      toast.error('Answer every question before submitting.');
      return;
    }
    submitAttempt.mutate(
      { attemptId, answers: payload },
      {
        onSuccess: () => navigate(`/student/attempts/${attemptId}`, { replace: true }),
        onError: (error) => toast.error('Could not submit your test', getApiErrorMessage(error)),
      }
    );
  }

  const minutes = remainingMs !== null ? Math.floor(remainingMs / 60_000) : null;
  const seconds = remainingMs !== null ? Math.floor((remainingMs % 60_000) / 1000) : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow">Practice quiz</p>
          <h1 className="mt-1 font-display text-2xl font-medium text-ink">
            {test.questions.length} questions
          </h1>
        </div>
        {remainingMs !== null && (
          <div
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 font-mono text-sm',
              remainingMs < 60_000 ? 'bg-flag-soft text-flag' : 'bg-paper-sunken text-ink-muted'
            )}
          >
            <Clock className="size-4" />
            {minutes}:{String(seconds).padStart(2, '0')}
          </div>
        )}
      </div>

      {test.questions.map((q, i) => (
        <Card key={i}>
          <CardContent>
            <p className="text-sm font-medium text-ink">
              {i + 1}. {q.prompt}
              <span className="ml-2 font-mono text-xs font-normal text-ink-faint">{q.points} pts</span>
            </p>
            {q.type === 'mcq' ? (
              <div className="mt-3 space-y-2">
                {q.options?.map((option) => (
                  <label
                    key={option}
                    className={cn(
                      'flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors',
                      answers[i] === option
                        ? 'border-board bg-board-soft text-board-strong'
                        : 'border-border-strong hover:bg-paper-sunken'
                    )}
                  >
                    <input
                      type="radio"
                      name={`question-${i}`}
                      value={option}
                      checked={answers[i] === option}
                      onChange={() => setAnswers((a) => ({ ...a, [i]: option }))}
                      className="accent-current"
                    />
                    {option}
                  </label>
                ))}
              </div>
            ) : (
              <Textarea
                className="mt-3"
                placeholder="Write your answer..."
                value={answers[i] ?? ''}
                onChange={(e) => setAnswers((a) => ({ ...a, [i]: e.target.value }))}
              />
            )}
          </CardContent>
        </Card>
      ))}

      <Button className="w-full" size="lg" onClick={handleSubmit} isLoading={submitAttempt.isPending}>
        Submit
      </Button>
    </div>
  );
}
