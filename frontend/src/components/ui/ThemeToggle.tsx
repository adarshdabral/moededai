import { Laptop, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useThemeStore } from '@/stores/themeStore';
import type { Theme } from '@/stores/themeStore';

const options: { value: Theme; icon: typeof Sun; label: string }[] = [
  { value: 'light', icon: Sun, label: 'Light theme' },
  { value: 'dark', icon: Moon, label: 'Dark theme' },
  { value: 'system', icon: Laptop, label: 'System theme' },
];

export function ThemeToggle() {
  const { theme, setTheme } = useThemeStore();

  return (
    <div role="radiogroup" aria-label="Theme" className="inline-flex rounded-md border border-border-strong p-0.5">
      {options.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          role="radio"
          aria-checked={theme === value}
          aria-label={label}
          onClick={() => setTheme(value)}
          className={cn(
            'flex size-7 items-center justify-center rounded-sm transition-colors',
            theme === value ? 'bg-board text-paper' : 'text-ink-muted hover:text-ink'
          )}
        >
          <Icon className="size-3.5" />
        </button>
      ))}
    </div>
  );
}
