import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/Button';
import { PasswordInput, Label, FieldError } from '@/components/ui/Input';
import { useResetPassword } from '@/hooks/useAuth';
import { getApiErrorMessage } from '@/api/client';

const schema = z.object({ newPassword: z.string().min(8, 'Must be at least 8 characters.').max(128) });
type FormValues = z.infer<typeof schema>;

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const resetPassword = useResetPassword();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  if (!token) {
    return (
      <AuthLayout>
        <p className="rounded-md bg-flag-soft px-3 py-2 text-sm text-flag">
          This reset link is missing its token. Request a new one from the forgot-password page.
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <h1 className="font-display text-2xl font-medium text-ink">Choose a new password</h1>

      <form
        className="mt-6 space-y-4"
        onSubmit={handleSubmit((values) => resetPassword.mutate({ token, newPassword: values.newPassword }))}
      >
        <div>
          <Label htmlFor="newPassword">New password</Label>
          <PasswordInput
            id="newPassword"
            autoComplete="new-password"
            {...register('newPassword')}
            error={errors.newPassword?.message}
          />
          <FieldError>{errors.newPassword?.message}</FieldError>
        </div>

        {resetPassword.isError && (
          <p role="alert" className="rounded-md bg-flag-soft px-3 py-2 text-sm text-flag">
            {getApiErrorMessage(resetPassword.error)}
          </p>
        )}

        <Button type="submit" className="w-full" isLoading={resetPassword.isPending}>
          Reset password
        </Button>
      </form>
    </AuthLayout>
  );
}
