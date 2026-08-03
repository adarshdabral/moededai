import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from './Button';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children?: ReactNode;
  side?: 'left' | 'right';
  widthClassName?: string;
}

export function Drawer({ open, onClose, title, children, side = 'right', widthClassName = 'max-w-md' }: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-ink/40"
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ x: side === 'right' ? '100%' : '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: side === 'right' ? '100%' : '-100%' }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              'relative z-10 flex h-full w-full flex-col border-border bg-paper-raised shadow-lg',
              side === 'right' ? 'ml-auto border-l' : 'mr-auto border-r',
              widthClassName
            )}
          >
            {title && (
              <div className="flex items-center justify-between border-b border-border p-4">
                <h2 className="font-display text-lg font-medium text-ink">{title}</h2>
                <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close panel">
                  <X className="size-4" />
                </Button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto scrollbar-thin">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
