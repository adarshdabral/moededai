import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle2 } from 'lucide-react';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input, Label, FieldError } from '@/components/ui/Input';
import { useRequestPasswordReset } from '@/hooks/useAuth';

const schema = z.object({ email: z.string().email('Enter a valid email address.') });
type FormValues = z.infer<typeof schema>;

export function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const requestReset = useRequestPasswordReset();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  if (submitted) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center text-center">
          <CheckCircle2 className="size-10 text-correct" />
          <h1 className="mt-4 font-display text-2xl font-medium text-ink">Check your email</h1>
          <p className="mt-2 text-sm text-ink-muted">
            If an account exists for that address, a reset link is on its way.
          </p>
          <Link to="/login" className="mt-6 text-sm font-medium text-board hover:underline">
            Back to log in
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <h1 className="font-display text-2xl font-medium text-ink">Reset your password</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Enter your email and we'll send you a reset link.
      </p>

      <form
        className="mt-6 space-y-4"
        onSubmit={handleSubmit((values) => requestReset.mutate(values.email, { onSuccess: () => setSubmitted(true) }))}
      >
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" {...register('email')} error={errors.email?.message} />
          <FieldError>{errors.email?.message}</FieldError>
        </div>
        <Button type="submit" className="w-full" isLoading={requestReset.isPending}>
          Send reset link
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-muted">
        <Link to="/login" className="font-medium text-board hover:underline">
          Back to log in
        </Link>
      </p>
    </AuthLayout>
  );
}
