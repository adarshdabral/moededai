import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Flag, Send } from 'lucide-react';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Dialog } from '@/components/ui/Dialog';
import { useDoubt, usePostReply, useReplies, useReportDoubt, useUpdateDoubtStatus } from '@/hooks/useDoubts';
import { toast } from '@/components/ui/toastStore';
import { getApiErrorMessage } from '@/api/client';

const statusVariant = { open: 'gold', answered: 'correct', closed: 'neutral' } as const;

export function TeacherDoubtDetailPage() {
  const { doubtId } = useParams();
  const { data: doubt, isLoading } = useDoubt(doubtId);
  const { data: replies } = useReplies(doubtId);
  const postReply = usePostReply(doubtId ?? '');
  const updateStatus = useUpdateDoubtStatus(doubtId ?? '');
  const reportDoubt = useReportDoubt();
  const [message, setMessage] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');

  if (isLoading || !doubt) return <Skeleton className="h-64" />;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Breadcrumb items={[{ label: 'Doubts', to: '/teacher/doubts' }, { label: 'Thread' }]} />

      <Card>
        <CardContent>
          <div className="flex items-start justify-between gap-3">
            <p className="text-base text-ink">{doubt.question}</p>
            <Badge variant={statusVariant[doubt.status]}>{doubt.status}</Badge>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Select
              value={doubt.status}
              onChange={(e) => updateStatus.mutate(e.target.value as 'open' | 'answered' | 'closed')}
              className="w-40"
            >
              <option value="open">Open</option>
              <option value="answered">Answered</option>
              <option value="closed">Closed</option>
            </Select>
            <button
              onClick={() => setReportOpen(true)}
              className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-flag"
            >
              <Flag className="size-3.5" />
              Report
            </button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {replies?.map((r) => (
          <div key={r.id} className="rounded-md bg-paper-sunken p-3">
            <p className="text-xs font-medium text-ink-muted">
              {r.authorRole === 'teacher' ? 'You (teacher)' : 'Anonymous student'}
            </p>
            <p className="mt-1 text-sm text-ink">{r.message}</p>
          </div>
        ))}
        {replies?.length === 0 && <p className="text-sm text-ink-muted">No replies yet.</p>}
      </div>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!message.trim()) return;
          postReply.mutate(message, {
            onSuccess: () => setMessage(''),
            onError: (error) => toast.error('Could not post reply', getApiErrorMessage(error)),
          });
        }}
      >
        <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Reply..." className="min-h-10 flex-1" rows={1} />
        <Button type="submit" size="icon" isLoading={postReply.isPending}>
          <Send className="size-4" />
        </Button>
      </form>

      <Dialog open={reportOpen} onClose={() => setReportOpen(false)} title="Report this doubt">
        <Textarea value={reportReason} onChange={(e) => setReportReason(e.target.value)} placeholder="Why are you reporting this?" />
        <Button
          className="mt-3 w-full"
          isLoading={reportDoubt.isPending}
          onClick={() =>
            reportDoubt.mutate(
              { doubtId: doubtId!, reason: reportReason },
              {
                onSuccess: () => {
                  toast.success('Report filed');
                  setReportOpen(false);
                  setReportReason('');
                },
                onError: (error) => toast.error('Could not file report', getApiErrorMessage(error)),
              }
            )
          }
        >
          Submit report
        </Button>
      </Dialog>
    </div>
  );
}
