import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarPlus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Label, FieldError } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useCourseAssessments, useScheduleAssessment } from '@/hooks/useAssessments';
import { useTopics } from '@/hooks/useCourses';
import { toast } from '@/components/ui/toastStore';
import { getApiErrorMessage } from '@/api/client';

const statusVariant = { scheduled: 'neutral', open: 'correct', closed: 'board' } as const;

const schema = z.object({
  topicId: z.string().min(1, 'Select a topic.'),
  scheduledFor: z.string().min(1, 'Pick a start date.'),
  windowClosesAt: z.string().min(1, 'Pick a close date.'),
  difficulty: z.enum(['easy', 'medium', 'hard', 'adaptive']),
  questionCount: z.coerce.number().int().min(1).max(20),
  timeLimitMinutes: z.coerce.number().int().min(1).max(180),
});
type FormValues = z.infer<typeof schema>;

export function AssessmentsTab({ courseId }: { courseId: string }) {
  const { data: topics } = useTopics(courseId);
  const { data: assessments, isLoading } = useCourseAssessments(courseId);
  const scheduleAssessment = useScheduleAssessment(courseId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { difficulty: 'adaptive', questionCount: 5, timeLimitMinutes: 30 },
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardContent>
          <form
            className="space-y-3"
            onSubmit={handleSubmit((values) =>
              scheduleAssessment.mutate(
                {
                  ...values,
                  scheduledFor: new Date(values.scheduledFor).toISOString(),
                  windowClosesAt: new Date(values.windowClosesAt).toISOString(),
                },
                {
                  onSuccess: (assessment) => {
                    toast.success(`Assessment scheduled for ${assessment.studentCount} students`);
                    reset();
                  },
                  onError: (error) => toast.error('Could not schedule assessment', getApiErrorMessage(error)),
                }
              )
            )}
          >
            <div>
              <Label htmlFor="topicId" required>
                Topic
              </Label>
              <Select id="topicId" {...register('topicId')} error={errors.topicId?.message}>
                <option value="">Select a topic</option>
                {topics?.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </Select>
              <FieldError>{errors.topicId?.message}</FieldError>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="scheduledFor" required>
                  Opens
                </Label>
                <Input id="scheduledFor" type="datetime-local" {...register('scheduledFor')} error={errors.scheduledFor?.message} />
                <FieldError>{errors.scheduledFor?.message}</FieldError>
              </div>
              <div>
                <Label htmlFor="windowClosesAt" required>
                  Closes
                </Label>
                <Input id="windowClosesAt" type="datetime-local" {...register('windowClosesAt')} error={errors.windowClosesAt?.message} />
                <FieldError>{errors.windowClosesAt?.message}</FieldError>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select id="difficulty" {...register('difficulty')}>
                  <option value="adaptive">Adaptive</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="questionCount">Questions</Label>
                <Input id="questionCount" type="number" {...register('questionCount')} />
              </div>
              <div>
                <Label htmlFor="timeLimitMinutes">Minutes</Label>
                <Input id="timeLimitMinutes" type="number" {...register('timeLimitMinutes')} />
              </div>
            </div>
            <p className="text-xs text-ink-faint">
              Generates one personalized AI test per actively-enrolled student — do this once
              your roster is set.
            </p>
            <Button type="submit" leftIcon={<CalendarPlus className="size-4" />} isLoading={scheduleAssessment.isPending}>
              Schedule assessment
            </Button>
          </form>
        </CardContent>
      </Card>

      {isLoading && <Skeleton className="h-24" />}
      {!isLoading && assessments?.length === 0 && (
        <EmptyState title="No assessments scheduled yet" description="Schedule one above once you have topics and enrolled students." />
      )}
      <div className="space-y-2">
        {assessments?.map((a) => (
          <Card key={a.id}>
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ink">
                  {topics?.find((t) => t.id === a.topicId)?.title ?? 'Topic'}
                </p>
                <p className="text-xs text-ink-faint">
                  {new Date(a.scheduledFor).toLocaleDateString()} → {new Date(a.windowClosesAt).toLocaleDateString()} ·{' '}
                  {a.studentCount} students
                </p>
              </div>
              <Badge variant={statusVariant[a.status]}>{a.status}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
