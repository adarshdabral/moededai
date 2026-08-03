import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Input, Label, FieldError } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { useMe, useUpdateProfile, useUploadAvatar } from '@/hooks/useUser';
import { toast } from '@/components/ui/toastStore';
import { getApiErrorMessage } from '@/api/client';

const schema = z.object({ name: z.string().min(2).max(100) });
type FormValues = z.infer<typeof schema>;

export function ProfilePage() {
  const { data: user, isLoading } = useMe();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<FormValues>({ resolver: zodResolver(schema), values: user ? { name: user.name } : undefined });

  if (isLoading || !user) return <Skeleton className="h-64" />;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <p className="eyebrow">Profile</p>
        <h1 className="mt-1 font-display text-3xl font-medium text-ink">Your profile</h1>
      </div>

      <Card>
        <CardContent className="flex items-center gap-4">
          <Avatar name={user.name} src={user.avatarUrl} size="lg" />
          <div>
            <label className="inline-flex cursor-pointer items-center rounded-md border border-border-strong px-3 py-1.5 text-sm font-medium text-ink hover:bg-paper-sunken">
              Change photo
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file)
                    uploadAvatar.mutate(file, {
                      onSuccess: () => toast.success('Profile photo updated'),
                      onError: (error) => toast.error('Could not upload photo', getApiErrorMessage(error)),
                    });
                }}
              />
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Account details" />
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={handleSubmit((values) =>
              updateProfile.mutate(values, {
                onSuccess: () => toast.success('Profile updated'),
                onError: (error) => toast.error('Could not update profile', getApiErrorMessage(error)),
              })
            )}
          >
            <div>
              <Label htmlFor="name">Full name</Label>
              <Input id="name" {...register('name')} error={errors.name?.message} />
              <FieldError>{errors.name?.message}</FieldError>
            </div>
            <div>
              <Label>Email</Label>
              <Input value={user.email} disabled />
            </div>
            <div>
              <Label>Student ID</Label>
              <Input value={user.id} disabled className="font-mono" />
              <p className="mt-1 text-xs text-ink-faint">
                Share this with your teacher so they can enroll you in a course.
              </p>
            </div>
            <div>
              <Label>Anonymous ID</Label>
              <Input value={user.anonymousId} disabled className="font-mono" />
              <p className="mt-1 text-xs text-ink-faint">
                Used when you post an anonymous doubt — teachers never see it linked to your name.
              </p>
            </div>
            <Button type="submit" disabled={!isDirty} isLoading={updateProfile.isPending}>
              Save changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
