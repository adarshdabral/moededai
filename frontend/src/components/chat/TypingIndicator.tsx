import { Bot } from 'lucide-react';

export function TypingIndicator() {
  return (
    <div className="flex gap-3" aria-live="polite" aria-label="Assistant is typing">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-board text-paper">
        <Bot className="size-4" />
      </div>
      <div className="flex items-center gap-1 rounded-lg border border-border bg-paper-raised px-4 py-3">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-1.5 animate-bounce rounded-full bg-ink-faint"
            style={{ animationDelay: `${i * 0.12}s` }}
          />
        ))}
      </div>
    </div>
  );
}
