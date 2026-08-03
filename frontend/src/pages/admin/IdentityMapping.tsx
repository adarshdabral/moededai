import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { KeyRound, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Label, FieldError, Textarea } from '@/components/ui/Input';
import { useResolveIdentity } from '@/hooks/useAdmin';
import { getApiErrorMessage } from '@/api/client';

const schema = z.object({
  anonymousId: z.string().min(1, 'Enter an anonymous ID.'),
  reason: z.string().min(10, 'Explain why — at least 10 characters. This is permanently audit-logged.').max(1000),
});
type FormValues = z.infer<typeof schema>;

export function IdentityMappingPage() {
  const resolveIdentity = useResolveIdentity();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <p className="eyebrow">Identity Mapping</p>
        <h1 className="mt-1 font-display text-3xl font-medium text-ink">Resolve an anonymous ID</h1>
      </div>

      <div className="flex gap-3 rounded-md border border-flag/30 bg-flag-soft p-4">
        <ShieldAlert className="size-5 shrink-0 text-flag" />
        <p className="text-sm text-ink">
          This is the platform's only way to unmask an anonymous doubt author. Every resolution is
          permanently written to the audit log with your admin ID, the anonymous ID, and your
          stated reason.
        </p>
      </div>

      <Card>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={handleSubmit((values) => resolveIdentity.mutate(values))}
          >
            <div>
              <Label htmlFor="anonymousId" required>
                Anonymous ID
              </Label>
              <Input id="anonymousId" className="font-mono" placeholder="anon_..." {...register('anonymousId')} error={errors.anonymousId?.message} />
              <FieldError>{errors.anonymousId?.message}</FieldError>
            </div>
            <div>
              <Label htmlFor="reason" required>
                Reason
              </Label>
              <Textarea id="reason" {...register('reason')} error={errors.reason?.message} />
              <FieldError>{errors.reason?.message}</FieldError>
            </div>
            <Button type="submit" leftIcon={<KeyRound className="size-4" />} className="w-full" isLoading={resolveIdentity.isPending}>
              Resolve identity
            </Button>
            {resolveIdentity.isError && (
              <p role="alert" className="rounded-md bg-flag-soft px-3 py-2 text-sm text-flag">
                {getApiErrorMessage(resolveIdentity.error)}
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      {resolveIdentity.isSuccess && (
        <Card>
          <CardHeader title="Resolved identity" />
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-ink-muted">Name:</span> <span className="font-medium text-ink">{resolveIdentity.data.name}</span>
            </p>
            <p>
              <span className="text-ink-muted">Email:</span> {resolveIdentity.data.email}
            </p>
            <p>
              <span className="text-ink-muted">User ID:</span> <span className="font-mono">{resolveIdentity.data.userId}</span>
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
