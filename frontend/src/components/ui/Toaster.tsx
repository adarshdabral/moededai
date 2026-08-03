import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, X, XCircle, Info } from 'lucide-react';
import { useToastStore } from './toastStore';
import { cn } from '@/lib/cn';

const icons = {
  success: <CheckCircle2 className="size-5 text-correct" aria-hidden />,
  error: <XCircle className="size-5 text-flag" aria-hidden />,
  default: <Info className="size-5 text-board" aria-hidden />,
};

export function Toaster() {
  const { toasts, dismiss } = useToastStore();

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2"
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className={cn(
              'pointer-events-auto flex items-start gap-3 rounded-lg border border-border bg-paper-raised p-4 shadow-md'
            )}
          >
            {icons[t.variant]}
            <div className="flex-1">
              <p className="text-sm font-medium text-ink">{t.title}</p>
              {t.description && <p className="mt-0.5 text-sm text-ink-muted">{t.description}</p>}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss notification"
              className="text-ink-faint hover:text-ink"
            >
              <X className="size-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
