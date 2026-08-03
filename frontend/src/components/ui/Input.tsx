import { forwardRef } from 'react';
import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  icon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, icon, ...props }, ref) => {
    return (
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          aria-invalid={Boolean(error)}
          className={cn(
            'h-10 w-full rounded-md border border-border-strong bg-paper-raised px-3 text-sm text-ink',
            'placeholder:text-ink-faint',
            'transition-colors focus:border-board focus:outline-none focus:ring-2 focus:ring-board/20',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-flag focus:border-flag focus:ring-flag/20',
            icon && 'pl-9',
            className
          )}
          {...props}
        />
      </div>
    );
  }
);
Input.displayName = 'Input';

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string }
>(({ className, error, ...props }, ref) => (
  <textarea
    ref={ref}
    aria-invalid={Boolean(error)}
    className={cn(
      'w-full rounded-md border border-border-strong bg-paper-raised px-3 py-2 text-sm text-ink',
      'placeholder:text-ink-faint resize-y min-h-20',
      'transition-colors focus:border-board focus:outline-none focus:ring-2 focus:ring-board/20',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      error && 'border-flag focus:border-flag focus:ring-flag/20',
      className
    )}
    {...props}
  />
));
Textarea.displayName = 'Textarea';

export function FieldError({ children }: { children?: string }) {
  if (!children) return null;
  return (
    <p role="alert" className="mt-1 text-xs text-flag">
      {children}
    </p>
  );
}

export function Label({
  children,
  htmlFor,
  required,
}: {
  children: ReactNode;
  htmlFor?: string;
  required?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-ink">
      {children}
      {required && (
        <span className="ml-0.5 text-flag" aria-hidden>
          *
        </span>
      )}
    </label>
  );
}
