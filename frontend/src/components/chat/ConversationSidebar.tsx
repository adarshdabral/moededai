import { MessageSquarePlus } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import type { ConversationSummaryDTO } from '@/types/domain';

interface ConversationSidebarProps {
  conversations: ConversationSummaryDTO[];
  activeId?: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  isLoading?: boolean;
}

export function ConversationSidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  isLoading,
}: ConversationSidebarProps) {
  return (
    <div className="flex h-full w-full flex-col border-r border-border bg-paper-sunken/40">
      <div className="p-3">
        <Button variant="secondary" className="w-full justify-start" leftIcon={<MessageSquarePlus className="size-4" />} onClick={onNew}>
          New conversation
        </Button>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto scrollbar-thin px-2 pb-3" aria-label="Conversation history">
        {isLoading &&
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        {!isLoading && conversations.length === 0 && (
          <p className="px-3 py-6 text-center text-sm text-ink-muted">
            No conversations yet — start one above.
          </p>
        )}
        {conversations.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            aria-current={c.id === activeId}
            className={cn(
              'block w-full truncate rounded-md px-3 py-2 text-left text-sm transition-colors',
              c.id === activeId ? 'bg-board-soft text-board-strong font-medium' : 'text-ink hover:bg-paper-sunken'
            )}
          >
            {c.title}
          </button>
        ))}
      </nav>
    </div>
  );
}
