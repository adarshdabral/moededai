import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type BadgeVariant = 'board' | 'gold' | 'correct' | 'flag' | 'neutral';

const variantStyles: Record<BadgeVariant, string> = {
  board: 'bg-board-soft text-board-strong',
  gold: 'bg-gold-soft text-gold-strong',
  correct: 'bg-correct-soft text-correct',
  flag: 'bg-flag-soft text-flag',
  neutral: 'bg-paper-sunken text-ink-muted',
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ className, variant = 'neutral', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}
