import { useState } from 'react';
import { ListOrdered, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useCreateLearningPath, useLearningPaths, useTopics } from '@/hooks/useCourses';
import { toast } from '@/components/ui/toastStore';
import { getApiErrorMessage } from '@/api/client';

export function LearningPathTab({ courseId }: { courseId: string }) {
  const { data: topics } = useTopics(courseId);
  const { data: paths, isLoading } = useLearningPaths(courseId);
  const createPath = useCreateLearningPath(courseId);
  const [title, setTitle] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const orderedSelection = (topics ?? [])
    .filter((t) => selected.has(t.id))
    .sort((a, b) => a.order - b.order)
    .map((t) => t.id);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-3">
          <div>
            <Label htmlFor="path-title">Learning path title</Label>
            <Input id="path-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Foundations" />
          </div>
          <div>
            <Label>Topics (in course order)</Label>
            <div className="mt-1 space-y-1.5">
              {topics?.map((topic) => (
                <label key={topic.id} className="flex items-center gap-2 text-sm text-ink">
                  <input
                    type="checkbox"
                    checked={selected.has(topic.id)}
                    onChange={(e) => {
                      const next = new Set(selected);
                      if (e.target.checked) next.add(topic.id);
                      else next.delete(topic.id);
                      setSelected(next);
                    }}
                  />
                  {topic.order}. {topic.title}
                </label>
              ))}
            </div>
          </div>
          <Button
            leftIcon={<Plus className="size-4" />}
            isLoading={createPath.isPending}
            disabled={!title.trim() || orderedSelection.length === 0}
            onClick={() =>
              createPath.mutate(
                { title, topicSequence: orderedSelection },
                {
                  onSuccess: () => {
                    toast.success('Learning path created');
                    setTitle('');
                    setSelected(new Set());
                  },
                  onError: (error) => toast.error('Could not create learning path', getApiErrorMessage(error)),
                }
              )
            }
          >
            Create learning path
          </Button>
        </CardContent>
      </Card>

      {isLoading && <Skeleton className="h-24" />}
      {!isLoading && paths?.length === 0 && (
        <EmptyState
          icon={<ListOrdered className="size-8" strokeWidth={1.25} />}
          title="No learning paths yet"
          description="Sequence topics above to guide students through the course."
        />
      )}
      <div className="space-y-3">
        {paths?.map((path) => (
          <Card key={path.id}>
            <CardContent>
              <h3 className="font-medium text-ink">{path.title}</h3>
              <ol className="mt-2 space-y-1 text-sm text-ink-muted">
                {path.topicSequence.map((topicId, i) => (
                  <li key={topicId}>
                    {i + 1}. {topics?.find((t) => t.id === topicId)?.title ?? topicId}
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
