import { forwardRef, useState } from 'react';
import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';
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

type PasswordInputProps = Omit<InputProps, 'type'>;

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, error, ...props }, ref) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
      <div className="relative">
        <input
          ref={ref}
          type={isVisible ? 'text' : 'password'}
          aria-invalid={Boolean(error)}
          className={cn(
            'h-10 w-full rounded-md border border-border-strong bg-paper-raised px-3 pr-10 text-sm text-ink',
            'placeholder:text-ink-faint',
            'transition-colors focus:border-board focus:outline-none focus:ring-2 focus:ring-board/20',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-flag focus:border-flag focus:ring-flag/20',
            className
          )}
          {...props}
        />
        <button
          type="button"
          onClick={() => setIsVisible((v) => !v)}
          tabIndex={-1}
          aria-label={isVisible ? 'Hide password' : 'Show password'}
          aria-pressed={isVisible}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-faint transition-colors hover:text-ink"
        >
          {isVisible ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
        </button>
      </div>
    );
  }
);
PasswordInput.displayName = 'PasswordInput';

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
