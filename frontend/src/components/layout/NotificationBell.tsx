import { useState } from 'react';
import { Bell } from 'lucide-react';
import { Drawer } from '@/components/ui/Drawer';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { useMarkNotificationRead, useNotifications } from '@/hooks/useNotifications';
import { cn } from '@/lib/cn';

const typeLabel: Record<string, string> = {
  test_reminder: 'Test reminder',
  score_update: 'Score update',
  announcement: 'Announcement',
  doubt_reply: 'Doubt reply',
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const unreadCount = data?.items.filter((n) => !n.isRead).length ?? 0;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        className="relative flex size-9 items-center justify-center rounded-md text-ink-muted hover:bg-paper-sunken hover:text-ink"
      >
        <Bell className="size-4.5" />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex size-2 rounded-full bg-gold" />
        )}
      </button>
      <Drawer open={open} onClose={() => setOpen(false)} title="Notifications">
        <div className="divide-y divide-border">
          {isLoading &&
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="mt-2 h-3 w-full" />
              </div>
            ))}
          {!isLoading && data?.items.length === 0 && (
            <div className="p-4">
              <EmptyState
                icon={<Bell className="size-8" strokeWidth={1.25} />}
                title="You're all caught up"
                description="New test reminders, score updates, and announcements will show up here."
              />
            </div>
          )}
          {data?.items.map((n) => (
            <button
              key={n.id}
              onClick={() => !n.isRead && markRead.mutate(n.id)}
              className={cn('block w-full p-4 text-left transition-colors hover:bg-paper-sunken', !n.isRead && 'bg-board-soft/40')}
            >
              <div className="flex items-center gap-2">
                <Badge variant={n.isRead ? 'neutral' : 'gold'}>{typeLabel[n.type] ?? n.type}</Badge>
                {!n.isRead && <span className="size-1.5 rounded-full bg-gold" aria-hidden />}
              </div>
              <p className="mt-1.5 text-sm font-medium text-ink">{n.title}</p>
              <p className="mt-0.5 text-sm text-ink-muted">{n.body}</p>
              <p className="mt-1.5 text-xs text-ink-faint">{new Date(n.createdAt).toLocaleString()}</p>
            </button>
          ))}
        </div>
      </Drawer>
    </>
  );
}
