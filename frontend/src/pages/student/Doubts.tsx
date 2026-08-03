import { useState } from 'react';
import { MessageCircleQuestion, Send } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Dialog } from '@/components/ui/Dialog';
import { useCourses, useMyEnrollments } from '@/hooks/useCourses';
import { useMyDoubts, usePostDoubt, useReplies, usePostReply } from '@/hooks/useDoubts';
import { toast } from '@/components/ui/toastStore';
import { getApiErrorMessage } from '@/api/client';

const statusVariant = { open: 'gold', answered: 'correct', closed: 'neutral' } as const;

function DoubtThread({ doubtId, onClose }: { doubtId: string; onClose: () => void }) {
  const { data: replies, isLoading } = useReplies(doubtId);
  const postReply = usePostReply(doubtId);
  const [message, setMessage] = useState('');

  return (
    <Dialog open onClose={onClose} title="Doubt thread" size="lg">
      <div className="max-h-96 space-y-3 overflow-y-auto scrollbar-thin">
        {isLoading && <Skeleton className="h-16" />}
        {replies?.length === 0 && <p className="text-sm text-ink-muted">No replies yet.</p>}
        {replies?.map((r) => (
          <div key={r.id} className="rounded-md bg-paper-sunken p-3">
            <p className="text-xs font-medium text-ink-muted">
              {r.authorRole === 'teacher' ? 'Teacher' : 'You (anonymous)'}
            </p>
            <p className="mt-1 text-sm text-ink">{r.message}</p>
          </div>
        ))}
      </div>
      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!message.trim()) return;
          postReply.mutate(message, { onSuccess: () => setMessage('') });
        }}
      >
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Add a follow-up..."
          className="min-h-10 flex-1"
          rows={1}
        />
        <Button type="submit" size="icon" isLoading={postReply.isPending}>
          <Send className="size-4" />
        </Button>
      </form>
    </Dialog>
  );
}

export function StudentDoubtsPage() {
  const { data: myDoubts, isLoading } = useMyDoubts();
  const { data: enrollments } = useMyEnrollments();
  const { data: courses } = useCourses({ limit: 100 });
  const postDoubt = usePostDoubt();
  const [courseId, setCourseId] = useState('');
  const [question, setQuestion] = useState('');
  const [openDoubtId, setOpenDoubtId] = useState<string | null>(null);

  const enrolledIds = new Set(enrollments?.map((e) => e.courseId));
  const enrolledCourses = courses?.items.filter((c) => enrolledIds.has(c.id)) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Anonymous Doubts</p>
        <h1 className="mt-1 font-display text-3xl font-medium text-ink">Ask without judgment</h1>
        <p className="mt-1 max-w-xl text-sm text-ink-muted">
          Your teacher sees your question, never who asked it.
        </p>
      </div>

      <Card>
        <CardHeader title="Post a doubt" />
        <CardContent>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!courseId || !question.trim()) return;
              postDoubt.mutate(
                { courseId, question },
                {
                  onSuccess: () => {
                    setQuestion('');
                    toast.success('Doubt posted anonymously');
                  },
                  onError: (error) => toast.error('Could not post your doubt', getApiErrorMessage(error)),
                }
              );
            }}
          >
            <Select value={courseId} onChange={(e) => setCourseId(e.target.value)} required>
              <option value="" disabled>
                Select a course
              </option>
              {enrolledCourses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </Select>
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What's on your mind?"
              required
            />
            <Button type="submit" isLoading={postDoubt.isPending}>
              Post anonymously
            </Button>
          </form>
        </CardContent>
      </Card>

      <div>
        <p className="eyebrow mb-3">Your doubts</p>
        {isLoading && <Skeleton className="h-24" />}
        {!isLoading && myDoubts?.length === 0 && (
          <EmptyState
            icon={<MessageCircleQuestion className="size-8" strokeWidth={1.25} />}
            title="You haven't asked anything yet"
            description="Post above — it's completely anonymous."
          />
        )}
        <div className="space-y-2">
          {myDoubts?.map((d) => (
            <button key={d.id} onClick={() => setOpenDoubtId(d.id)} className="block w-full text-left">
              <Card className="transition-shadow hover:shadow-sm">
                <CardContent className="flex items-start justify-between gap-3">
                  <p className="text-sm text-ink">{d.question}</p>
                  <Badge variant={statusVariant[d.status]}>{d.status}</Badge>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      </div>

      {openDoubtId && <DoubtThread doubtId={openDoubtId} onClose={() => setOpenDoubtId(null)} />}
    </div>
  );
}
