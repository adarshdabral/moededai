import { useParams, useNavigate } from 'react-router-dom';
import { CalendarClock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAssessment, useStartAssessmentAttempt } from '@/hooks/useAssessments';
import { getApiErrorMessage } from '@/api/client';
import { toast } from '@/components/ui/toastStore';

const statusVariant = { scheduled: 'neutral', open: 'correct', closed: 'flag' } as const;

export function AssessmentDetailPage() {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const { data: assessment, isLoading, isError, error } = useAssessment(assessmentId);
  const startAttempt = useStartAssessmentAttempt();

  if (isLoading) return <Skeleton className="h-48" />;

  if (isError || !assessment) {
    return (
      <Card className="mx-auto max-w-md p-6 text-center">
        <p className="text-sm text-flag">{getApiErrorMessage(error) || 'Assessment not found.'}</p>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <Card className="p-6">
        <div className="flex items-center gap-2">
          <CalendarClock className="size-5 text-board" />
          <p className="eyebrow">Monthly Assessment</p>
        </div>
        <h1 className="mt-2 font-display text-2xl font-medium text-ink">
          Opens {new Date(assessment.scheduledFor).toLocaleDateString()}
        </h1>
        <div className="mt-3 flex items-center gap-2">
          <Badge variant={statusVariant[assessment.status]}>{assessment.status}</Badge>
          <span className="text-sm text-ink-muted">
            Closes {new Date(assessment.windowClosesAt).toLocaleString()}
          </span>
        </div>

        <CardContent className="mt-4 px-0">
          {assessment.status !== 'open' && (
            <p className="text-sm text-ink-muted">
              This assessment {assessment.status === 'scheduled' ? 'has not opened yet' : 'has closed'}.
            </p>
          )}
          {assessment.status === 'open' && (
            <Button
              className="w-full"
              isLoading={startAttempt.isPending}
              onClick={() =>
                startAttempt.mutate(assessment.id, {
                  onSuccess: (attempt) => navigate(`/student/attempts/${attempt.id}/take`),
                  onError: (error) => toast.error('Could not start your attempt', getApiErrorMessage(error)),
                })
              }
            >
              Start attempt
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
