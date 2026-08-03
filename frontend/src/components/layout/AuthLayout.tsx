import type { ReactNode } from 'react';
import { Logo } from './Logo';

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-svh grid-cols-1 lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-board p-10 text-paper lg:flex">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
          aria-hidden
        />
        <Logo className="relative text-paper [&_span]:text-paper" />
        <div className="relative max-w-md">
          <p className="font-display text-4xl font-medium leading-tight">
            Every student's growth, made visible.
          </p>
          <p className="mt-4 text-board-soft/90 text-base">
            An AI tutor, adaptive assessments, and a Knowledge Score you can actually trust —
            because doubts stay anonymous and mastery is never guessed.
          </p>
        </div>
        <p className="relative text-sm text-paper/60">© {new Date().getFullYear()} ModEd.ai</p>
      </div>
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <Logo className="mb-8 lg:hidden" />
          {children}
        </div>
      </div>
    </div>
  );
}
