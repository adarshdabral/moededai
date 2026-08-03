import { useState } from 'react';
import { Bell } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';
import { useMarkNotificationRead, useNotifications } from '@/hooks/useNotifications';
import { cn } from '@/lib/cn';

const typeLabel: Record<string, string> = {
  test_reminder: 'Test reminder',
  score_update: 'Score update',
  announcement: 'Announcement',
  doubt_reply: 'Doubt reply',
};

/** Shared across all three portals - the underlying data and actions are identical per role. */
export function NotificationsPageContent() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useNotifications(page);
  const markRead = useMarkNotificationRead();

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Notifications</p>
        <h1 className="mt-1 font-display text-3xl font-medium text-ink">Notifications</h1>
      </div>

      {isLoading && <Skeleton className="h-64" />}
      {!isLoading && data?.items.length === 0 && (
        <EmptyState icon={<Bell className="size-8" strokeWidth={1.25} />} title="You're all caught up" description="Nothing new right now." />
      )}

      <div className="space-y-2">
        {data?.items.map((n) => (
          <Card
            key={n.id}
            className={cn('cursor-pointer transition-shadow hover:shadow-sm', !n.isRead && 'border-gold/50 bg-gold-soft/30')}
            onClick={() => !n.isRead && markRead.mutate(n.id)}
          >
            <CardContent>
              <div className="flex items-center gap-2">
                <Badge variant={n.isRead ? 'neutral' : 'gold'}>{typeLabel[n.type] ?? n.type}</Badge>
                <span className="text-xs text-ink-faint">{new Date(n.createdAt).toLocaleString()}</span>
              </div>
              <p className="mt-1.5 text-sm font-medium text-ink">{n.title}</p>
              <p className="mt-0.5 text-sm text-ink-muted">{n.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {data?.pagination && <Pagination meta={data.pagination} onPageChange={setPage} />}
    </div>
  );
}
