import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input, Label, FieldError } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useRegister } from '@/hooks/useAuth';
import { getApiErrorMessage } from '@/api/client';

const GRADE_OPTIONS = ['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];

const schema = z.object({
  name: z.string().min(2, 'Enter your full name.').max(100),
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(8, 'Must be at least 8 characters.').max(128),
  gradeLevel: z.string().min(1, 'Select your grade.'),
});
type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
  const registerAccount = useRegister();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { gradeLevel: '' } });

  return (
    <AuthLayout>
      <h1 className="font-display text-2xl font-medium text-ink">Create your account</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Student accounts only — teachers and admins are added by an administrator.
      </p>

      <form
        className="mt-6 space-y-4"
        onSubmit={handleSubmit((values) => registerAccount.mutate(values))}
      >
        <div>
          <Label htmlFor="name">Full name</Label>
          <Input id="name" autoComplete="name" {...register('name')} error={errors.name?.message} />
          <FieldError>{errors.name?.message}</FieldError>
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" {...register('email')} error={errors.email?.message} />
          <FieldError>{errors.email?.message}</FieldError>
        </div>
        <div>
          <Label htmlFor="gradeLevel">Grade</Label>
          <Select id="gradeLevel" {...register('gradeLevel')} error={errors.gradeLevel?.message}>
            <option value="" disabled>
              Select your grade
            </option>
            {GRADE_OPTIONS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </Select>
          <FieldError>{errors.gradeLevel?.message}</FieldError>
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            {...register('password')}
            error={errors.password?.message}
          />
          <FieldError>{errors.password?.message}</FieldError>
        </div>

        {registerAccount.isError && (
          <p role="alert" className="rounded-md bg-flag-soft px-3 py-2 text-sm text-flag">
            {getApiErrorMessage(registerAccount.error)}
          </p>
        )}

        <Button type="submit" className="w-full" isLoading={registerAccount.isPending}>
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-muted">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-board hover:underline">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}
