import { useNavigate, useParams } from 'react-router-dom';
import { FileText, Link as LinkIcon, Sparkles, Video, Wand2 } from 'lucide-react';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useCourse, useResources, useTopics } from '@/hooks/useCourses';
import { useGenerateTest, useStartAttempt } from '@/hooks/useAiTest';
import { useStartConversation } from '@/hooks/useAiTutor';
import { toast } from '@/components/ui/toastStore';
import { getApiErrorMessage } from '@/api/client';

const resourceIcons = { document: FileText, video: Video, link: LinkIcon, upload: FileText };

export function TopicDetailPage() {
  const { courseId, topicId } = useParams();
  const navigate = useNavigate();
  const { data: course } = useCourse(courseId);
  const { data: topics } = useTopics(courseId);
  const { data: resources, isLoading: resourcesLoading } = useResources(topicId);
  const generateTest = useGenerateTest();
  const startAttempt = useStartAttempt();
  const startConversation = useStartConversation();

  const topic = topics?.find((t) => t.id === topicId);

  function handlePractice() {
    if (!topicId) return;
    generateTest.mutate(
      { topicId, difficulty: 'adaptive', questionCount: 5, timeLimitMinutes: 15 },
      {
        onSuccess: (test) => {
          startAttempt.mutate(test.id, {
            onSuccess: (attempt) => navigate(`/student/attempts/${attempt.id}/take`),
          });
        },
        onError: (error) => toast.error('Could not generate a quiz', getApiErrorMessage(error)),
      }
    );
  }

  function handleAskTutor() {
    startConversation.mutate(topicId, {
      onSuccess: (conversation) => navigate(`/student/ai-tutor/${conversation.id}`),
    });
  }

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Courses', to: '/student/courses' },
          { label: course?.title ?? '…', to: `/student/courses/${courseId}` },
          { label: topic?.title ?? 'Topic' },
        ]}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="eyebrow">Topic {topic?.order}</p>
          <h1 className="mt-1 font-display text-3xl font-medium text-ink">{topic?.title}</h1>
          {topic && topic.learningObjectives.length > 0 && (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-ink-muted">
              {topic.learningObjectives.map((obj, i) => (
                <li key={i}>{obj}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <Button variant="outline" leftIcon={<Sparkles className="size-4" />} onClick={handleAskTutor} isLoading={startConversation.isPending}>
            Ask AI Tutor
          </Button>
          <Button
            variant="gold"
            leftIcon={<Wand2 className="size-4" />}
            onClick={handlePractice}
            isLoading={generateTest.isPending || startAttempt.isPending}
          >
            Practice quiz
          </Button>
        </div>
      </div>

      <div>
        <p className="eyebrow mb-3">Resources</p>
        {resourcesLoading && <Skeleton className="h-24" />}
        {!resourcesLoading && resources?.length === 0 && (
          <EmptyState title="No resources yet" description="Your teacher hasn't added any materials for this topic." />
        )}
        <div className="space-y-2">
          {resources?.map((r) => {
            const Icon = resourceIcons[r.type];
            return (
              <a key={r.id} href={r.url} target="_blank" rel="noreferrer" className="block">
                <Card className="transition-shadow hover:shadow-sm">
                  <CardContent className="flex items-center gap-3 py-3">
                    <Icon className="size-4 shrink-0 text-board" />
                    <span className="text-sm font-medium text-ink">{r.title}</span>
                  </CardContent>
                </Card>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
