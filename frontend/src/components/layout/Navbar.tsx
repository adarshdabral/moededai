import { Menu, LogOut, Search, Settings, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '@/components/ui/Avatar';
import { Dropdown } from '@/components/ui/Dropdown';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { NotificationBell } from './NotificationBell';
import { useMe } from '@/hooks/useUser';
import { useLogout } from '@/hooks/useAuth';

interface NavbarProps {
  onMenuClick: () => void;
  onSearchClick: () => void;
}

export function Navbar({ onMenuClick, onSearchClick }: NavbarProps) {
  const { data: user } = useMe();
  const logout = useLogout();
  const navigate = useNavigate();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-paper-raised px-4">
      <div className="flex items-center gap-2">
        <button
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          className="flex size-9 items-center justify-center rounded-md text-ink-muted hover:bg-paper-sunken lg:hidden"
        >
          <Menu className="size-5" />
        </button>
        <button
          onClick={onSearchClick}
          className="hidden items-center gap-2 rounded-md border border-border-strong px-3 py-1.5 text-sm text-ink-muted hover:bg-paper-sunken sm:flex"
        >
          <Search className="size-3.5" />
          Jump to...
          <kbd className="ml-2 rounded border border-border px-1 font-mono text-[10px]">⌘K</kbd>
        </button>
        <button
          onClick={onSearchClick}
          aria-label="Search"
          className="flex size-9 items-center justify-center rounded-md text-ink-muted hover:bg-paper-sunken sm:hidden"
        >
          <Search className="size-4.5" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <NotificationBell />
        {user && (
          <Dropdown
            trigger={<Avatar name={user.name} src={user.avatarUrl} size="sm" />}
            items={[
              { label: 'Profile', onSelect: () => navigate(`/${user.role}/profile`), icon: <UserRound className="size-4" /> },
              { label: 'Settings', onSelect: () => navigate(`/${user.role}/settings`), icon: <Settings className="size-4" /> },
              { label: 'Log out', onSelect: () => logout.mutate(), destructive: true, icon: <LogOut className="size-4" /> },
            ]}
          />
        )}
      </div>
    </header>
  );
}
