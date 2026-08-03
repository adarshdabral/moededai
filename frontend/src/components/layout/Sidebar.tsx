import { NavLink } from 'react-router-dom';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Logo } from './Logo';
import { NAV_ITEMS } from './navConfig';
import type { Role } from '@/types/api';

interface SidebarProps {
  role: Role;
  footer?: ReactNode;
  onNavigate?: () => void;
}

export function Sidebar({ role, footer, onNavigate }: SidebarProps) {
  const items = NAV_ITEMS[role];

  return (
    <div className="flex h-full w-64 shrink-0 flex-col border-r border-border bg-paper-raised">
      <div className="p-5">
        <Logo />
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto scrollbar-thin px-3" aria-label="Main navigation">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-board-soft font-medium text-board-strong'
                  : 'text-ink-muted hover:bg-paper-sunken hover:text-ink'
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute -left-3 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-gold" />
                )}
                <item.icon className="size-4 shrink-0" aria-hidden />
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      {footer && <div className="border-t border-border p-3">{footer}</div>}
    </div>
  );
}
