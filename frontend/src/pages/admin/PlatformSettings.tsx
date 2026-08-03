import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Label, Textarea } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { usePlatformSettings, useUpdatePlatformSettings } from '@/hooks/useAdmin';
import { toast } from '@/components/ui/toastStore';
import { getApiErrorMessage } from '@/api/client';

const schema = z.object({ maintenanceMode: z.boolean(), announcement: z.string().max(500).optional() });
type FormValues = z.infer<typeof schema>;

export function PlatformSettingsPage() {
  const { data: settings, isLoading } = usePlatformSettings();
  const updateSettings = useUpdatePlatformSettings();

  const { register, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: settings,
  });

  if (isLoading || !settings) return <Skeleton className="h-64" />;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <p className="eyebrow">Platform Settings</p>
        <h1 className="mt-1 font-display text-3xl font-medium text-ink">Platform settings</h1>
      </div>

      <Card>
        <CardHeader title="Appearance" description="Your own theme preference for this device." />
        <CardContent>
          <ThemeToggle />
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Maintenance mode & announcement banner" />
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={handleSubmit((values) =>
              updateSettings.mutate(values, {
                onSuccess: () => toast.success('Settings saved'),
                onError: (error) => toast.error('Could not save settings', getApiErrorMessage(error)),
              })
            )}
          >
            <label className="flex items-center gap-2 text-sm text-ink">
              <input type="checkbox" {...register('maintenanceMode')} />
              Maintenance mode
            </label>
            <div>
              <Label htmlFor="announcement">Platform-wide banner text</Label>
              <Textarea id="announcement" {...register('announcement')} placeholder="Scheduled maintenance tonight at 10pm." />
            </div>
            <Button type="submit" isLoading={updateSettings.isPending}>
              Save settings
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
