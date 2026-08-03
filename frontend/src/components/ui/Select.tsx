import { forwardRef } from 'react';
import type { SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        aria-invalid={Boolean(error)}
        className={cn(
          'h-10 w-full appearance-none rounded-md border border-border-strong bg-paper-raised px-3 pr-9 text-sm text-ink',
          'transition-colors focus:border-board focus:outline-none focus:ring-2 focus:ring-board/20',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error && 'border-flag',
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint"
        aria-hidden
      />
    </div>
  )
);
Select.displayName = 'Select';
