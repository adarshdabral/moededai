import { cn } from '@/lib/cn';

export function Logo({ className, mark }: { className?: string; mark?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2 font-display', className)}>
      <svg viewBox="0 0 32 32" className="size-7 shrink-0" aria-hidden>
        <circle cx="16" cy="16" r="15" fill="var(--board)" />
        <path
          d="M9 21 L9 11 L16 16 L23 11 L23 21"
          fill="none"
          stroke="var(--gold)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {!mark && <span className="text-lg font-medium text-ink">ModEd.ai</span>}
    </div>
  );
}
