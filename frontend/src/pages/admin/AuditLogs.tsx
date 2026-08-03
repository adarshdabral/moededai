import { useState } from 'react';
import { ScrollText } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '@/components/ui/Table';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { Badge } from '@/components/ui/Badge';
import { useAuditLogs } from '@/hooks/useAdmin';

export function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAuditLogs(page);

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Audit Logs</p>
        <h1 className="mt-1 font-display text-3xl font-medium text-ink">Audit trail</h1>
        <p className="mt-1 text-sm text-ink-muted">Append-only. Every sensitive admin action is recorded here.</p>
      </div>

      {isLoading && <Skeleton className="h-64" />}
      {!isLoading && data?.items.length === 0 && (
        <EmptyState icon={<ScrollText className="size-8" strokeWidth={1.25} />} title="No audit entries yet" />
      )}

      {data && data.items.length > 0 && (
        <>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Action</TableHeaderCell>
                <TableHeaderCell>Target</TableHeaderCell>
                <TableHeaderCell>Reason</TableHeaderCell>
                <TableHeaderCell>Admin</TableHeaderCell>
                <TableHeaderCell>When</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.items.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <Badge variant="board">{log.action.replace(/_/g, ' ')}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {log.targetType}/{log.targetId.slice(-6)}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{log.reason}</TableCell>
                  <TableCell className="font-mono text-xs">#{log.actorAdminId.slice(-6)}</TableCell>
                  <TableCell className="text-xs text-ink-faint">{new Date(log.createdAt).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination meta={data.pagination} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
