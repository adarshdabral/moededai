import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input, Label, FieldError } from '@/components/ui/Input';
import { useLogin } from '@/hooks/useAuth';
import { getApiErrorMessage } from '@/api/client';

const schema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
});
type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const login = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  return (
    <AuthLayout>
      <h1 className="font-display text-2xl font-medium text-ink">Welcome back</h1>
      <p className="mt-1 text-sm text-ink-muted">Log in to continue your learning.</p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit((values) => login.mutate(values))}>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" {...register('email')} error={errors.email?.message} />
          <FieldError>{errors.email?.message}</FieldError>
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-xs text-board hover:underline">
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register('password')}
            error={errors.password?.message}
          />
          <FieldError>{errors.password?.message}</FieldError>
        </div>

        {login.isError && (
          <p role="alert" className="rounded-md bg-flag-soft px-3 py-2 text-sm text-flag">
            {getApiErrorMessage(login.error)}
          </p>
        )}

        <Button type="submit" className="w-full" isLoading={login.isPending}>
          Log in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-muted">
        New to ModEd.ai?{' '}
        <Link to="/register" className="font-medium text-board hover:underline">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
}
