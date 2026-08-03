import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { Logo } from '@/components/layout/Logo';

interface StatusPageProps {
  code?: string;
  icon: ReactNode;
  title: string;
  description: string;
  action?: { label: string; to: string };
}

export function StatusPage({ code, icon, title, description, action }: StatusPageProps) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-paper px-6 text-center">
      <Logo />
      <div className="text-ink-faint">{icon}</div>
      <div>
        {code && <p className="eyebrow mb-2">{code}</p>}
        <h1 className="font-display text-3xl font-medium text-ink">{title}</h1>
        <p className="mx-auto mt-2 max-w-md text-ink-muted">{description}</p>
      </div>
      {action && (
        <Link
          to={action.to}
          className="inline-flex h-10 items-center justify-center rounded-md bg-board px-4 text-sm font-medium text-paper transition-colors hover:bg-board-strong"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
