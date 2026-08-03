import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FileWarning } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Textarea, Label } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { useAbuseReports, useResolveAbuseReport } from '@/hooks/useDoubts';
import { toast } from '@/components/ui/toastStore';
import { getApiErrorMessage } from '@/api/client';

const statusVariant = { pending: 'gold', reviewing: 'board', resolved: 'correct', dismissed: 'neutral' } as const;

const schema = z.object({
  status: z.enum(['resolved', 'dismissed']),
  resolutionNotes: z.string().max(1000).optional(),
});
type FormValues = z.infer<typeof schema>;

export function AdminReportsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAbuseReports(page);
  const resolveReport = useResolveAbuseReport();
  const [activeReportId, setActiveReportId] = useState<string | null>(null);

  const { register, handleSubmit, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'dismissed' },
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Reports</p>
        <h1 className="mt-1 font-display text-3xl font-medium text-ink">Abuse reports</h1>
      </div>

      {isLoading && <Skeleton className="h-64" />}
      {!isLoading && data?.items.length === 0 && (
        <EmptyState icon={<FileWarning className="size-8" strokeWidth={1.25} />} title="No reports" description="Nothing has been flagged." />
      )}

      <div className="space-y-2">
        {data?.items.map((r) => (
          <Card key={r.id}>
            <CardContent className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-ink">{r.reason}</p>
                <p className="mt-1 text-xs text-ink-faint">
                  {r.reportedDoubtId ? 'Doubt' : 'Reply'} · reported by user #{r.reportedByUserId.slice(-6)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant={statusVariant[r.status]}>{r.status}</Badge>
                {(r.status === 'pending' || r.status === 'reviewing') && (
                  <Button size="sm" variant="outline" onClick={() => setActiveReportId(r.id)}>
                    Resolve
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {data?.pagination && <Pagination meta={data.pagination} onPageChange={setPage} />}

      <Dialog open={Boolean(activeReportId)} onClose={() => setActiveReportId(null)} title="Resolve report">
        <form
          className="space-y-4"
          onSubmit={handleSubmit((values) => {
            if (!activeReportId) return;
            resolveReport.mutate(
              { reportId: activeReportId, ...values },
              {
                onSuccess: () => {
                  toast.success('Report updated');
                  setActiveReportId(null);
                  reset();
                },
                onError: (error) => toast.error('Could not resolve report', getApiErrorMessage(error)),
              }
            );
          })}
        >
          <div>
            <Label htmlFor="status">Outcome</Label>
            <Select id="status" {...register('status')}>
              <option value="dismissed">Dismiss (not a violation)</option>
              <option value="resolved">Resolved (action taken)</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="resolutionNotes">Notes</Label>
            <Textarea id="resolutionNotes" {...register('resolutionNotes')} />
          </div>
          <Button type="submit" className="w-full" isLoading={resolveReport.isPending}>
            Save
          </Button>
        </form>
      </Dialog>
    </div>
  );
}
