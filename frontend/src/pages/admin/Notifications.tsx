import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Megaphone } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Label, FieldError, Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { NotificationsPageContent } from '@/components/layout/NotificationsPageContent';
import { useSendAnnouncement } from '@/hooks/useNotifications';
import { toast } from '@/components/ui/toastStore';
import { getApiErrorMessage } from '@/api/client';

const schema = z.object({
  title: z.string().min(1).max(150),
  body: z.string().min(1).max(1000),
  role: z.enum(['', 'student', 'teacher', 'admin']).optional(),
});
type FormValues = z.infer<typeof schema>;

export function AdminNotificationsPage() {
  const sendAnnouncement = useSendAnnouncement();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader
          title="Broadcast an announcement"
          description="Sent as an in-app notification to every active user, or just one role."
        />
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={handleSubmit((values) =>
              sendAnnouncement.mutate(
                { title: values.title, body: values.body, role: values.role || undefined },
                {
                  onSuccess: (result) => {
                    toast.success(`Sent to ${result.recipientCount} users`);
                    reset();
                  },
                  onError: (error) => toast.error('Could not send announcement', getApiErrorMessage(error)),
                }
              )
            )}
          >
            <div>
              <Label htmlFor="ann-title" required>
                Title
              </Label>
              <Input id="ann-title" {...register('title')} error={errors.title?.message} />
              <FieldError>{errors.title?.message}</FieldError>
            </div>
            <div>
              <Label htmlFor="ann-body" required>
                Message
              </Label>
              <Textarea id="ann-body" {...register('body')} error={errors.body?.message} />
              <FieldError>{errors.body?.message}</FieldError>
            </div>
            <div>
              <Label htmlFor="ann-role">Audience</Label>
              <Select id="ann-role" {...register('role')}>
                <option value="">Everyone</option>
                <option value="student">Students only</option>
                <option value="teacher">Teachers only</option>
                <option value="admin">Admins only</option>
              </Select>
            </div>
            <Button type="submit" leftIcon={<Megaphone className="size-4" />} isLoading={sendAnnouncement.isPending}>
              Send announcement
            </Button>
          </form>
        </CardContent>
      </Card>

      <NotificationsPageContent />
    </div>
  );
}
