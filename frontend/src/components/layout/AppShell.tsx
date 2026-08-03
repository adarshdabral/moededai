import { useMemo, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { Drawer } from '@/components/ui/Drawer';
import { CommandPalette } from '@/components/ui/CommandPalette';
import type { Command } from '@/components/ui/CommandPalette';
import { NAV_ITEMS } from './navConfig';
import { useAuthStore } from '@/stores/authStore';
import { useCommandPaletteShortcut } from '@/hooks/useCommandPaletteShortcut';

export function AppShell() {
  const role = useAuthStore((s) => s.user!.role);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const navigate = useNavigate();
  useCommandPaletteShortcut(() => setPaletteOpen((v) => !v));

  const commands: Command[] = useMemo(
    () =>
      NAV_ITEMS[role].map((item) => ({
        id: item.to,
        label: item.label,
        group: 'Navigate',
        icon: <item.icon className="size-4" />,
        onSelect: () => navigate(item.to),
      })),
    [role, navigate]
  );

  return (
    <div className="flex h-svh overflow-hidden bg-paper">
      <div className="hidden lg:block">
        <Sidebar role={role} />
      </div>
      <Drawer open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} widthClassName="max-w-64">
        <Sidebar role={role} onNavigate={() => setMobileNavOpen(false)} />
      </Drawer>

      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar onMenuClick={() => setMobileNavOpen(true)} onSearchClick={() => setPaletteOpen(true)} />
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} commands={commands} />
    </div>
  );
}
