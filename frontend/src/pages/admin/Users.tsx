import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, UserCheck, UserX } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Dialog } from '@/components/ui/Dialog';
import { Input, Label, FieldError, Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '@/components/ui/Table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import {
  useAdminUsers,
  useCreatePrivilegedUser,
  useDeactivateUser,
  useReactivateUser,
} from '@/hooks/useAdmin';
import { toast } from '@/components/ui/toastStore';
import { getApiErrorMessage } from '@/api/client';
import type { Role } from '@/types/api';

const createSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  role: z.enum(['teacher', 'admin']),
});
type CreateFormValues = z.infer<typeof createSchema>;

const reasonSchema = z.object({ reason: z.string().min(10, 'At least 10 characters.').max(1000) });
type ReasonFormValues = z.infer<typeof reasonSchema>;

export function AdminUsersPage() {
  const [roleTab, setRoleTab] = useState<'all' | Role>('all');
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [actionTarget, setActionTarget] = useState<{ userId: string; action: 'deactivate' | 'reactivate' } | null>(null);

  const { data, isLoading } = useAdminUsers({ page, limit: 20, role: roleTab === 'all' ? undefined : roleTab });
  const createUser = useCreatePrivilegedUser();
  const deactivateUser = useDeactivateUser();
  const reactivateUser = useReactivateUser();

  const createForm = useForm<CreateFormValues>({ resolver: zodResolver(createSchema), defaultValues: { role: 'teacher' } });
  const reasonForm = useForm<ReasonFormValues>({ resolver: zodResolver(reasonSchema) });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow">Users</p>
          <h1 className="mt-1 font-display text-3xl font-medium text-ink">Manage users</h1>
        </div>
        <Button leftIcon={<Plus className="size-4" />} onClick={() => setCreateOpen(true)}>
          New teacher/admin
        </Button>
      </div>

      <Tabs
        defaultValue="all"
        onValueChange={(v) => {
          setRoleTab(v as typeof roleTab);
          setPage(1);
        }}
      >
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="student">Students</TabsTrigger>
          <TabsTrigger value="teacher">Teachers</TabsTrigger>
          <TabsTrigger value="admin">Admins</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading && <Skeleton className="h-64" />}

      {!isLoading && data && (
        <>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Name</TableHeaderCell>
                <TableHeaderCell>Email</TableHeaderCell>
                <TableHeaderCell>Role</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Joined</TableHeaderCell>
                <TableHeaderCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {data.items.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell className="capitalize">{u.role}</TableCell>
                  <TableCell>
                    <Badge variant={u.isActive ? 'correct' : 'flag'}>{u.isActive ? 'Active' : 'Deactivated'}</Badge>
                  </TableCell>
                  <TableCell>{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <button
                      onClick={() =>
                        setActionTarget({ userId: u.id, action: u.isActive ? 'deactivate' : 'reactivate' })
                      }
                      className="flex items-center gap-1 text-sm text-ink-muted hover:text-ink"
                    >
                      {u.isActive ? <UserX className="size-3.5" /> : <UserCheck className="size-3.5" />}
                      {u.isActive ? 'Deactivate' : 'Reactivate'}
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination meta={data.pagination} onPageChange={setPage} />
        </>
      )}

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} title="Create teacher or admin account">
        <form
          className="space-y-4"
          onSubmit={createForm.handleSubmit((values) =>
            createUser.mutate(values, {
              onSuccess: () => {
                toast.success('Account created');
                setCreateOpen(false);
                createForm.reset();
              },
              onError: (error) => toast.error('Could not create account', getApiErrorMessage(error)),
            })
          )}
        >
          <div>
            <Label htmlFor="new-name" required>
              Name
            </Label>
            <Input id="new-name" {...createForm.register('name')} error={createForm.formState.errors.name?.message} />
            <FieldError>{createForm.formState.errors.name?.message}</FieldError>
          </div>
          <div>
            <Label htmlFor="new-email" required>
              Email
            </Label>
            <Input id="new-email" type="email" {...createForm.register('email')} error={createForm.formState.errors.email?.message} />
            <FieldError>{createForm.formState.errors.email?.message}</FieldError>
          </div>
          <div>
            <Label htmlFor="new-password" required>
              Temporary password
            </Label>
            <Input id="new-password" type="password" {...createForm.register('password')} error={createForm.formState.errors.password?.message} />
            <FieldError>{createForm.formState.errors.password?.message}</FieldError>
          </div>
          <div>
            <Label htmlFor="new-role">Role</Label>
            <Select id="new-role" {...createForm.register('role')}>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </Select>
          </div>
          <Button type="submit" className="w-full" isLoading={createUser.isPending}>
            Create account
          </Button>
        </form>
      </Dialog>

      <Dialog
        open={Boolean(actionTarget)}
        onClose={() => setActionTarget(null)}
        title={actionTarget?.action === 'deactivate' ? 'Deactivate account' : 'Reactivate account'}
      >
        <form
          className="space-y-4"
          onSubmit={reasonForm.handleSubmit((values) => {
            if (!actionTarget) return;
            const mutation = actionTarget.action === 'deactivate' ? deactivateUser : reactivateUser;
            mutation.mutate(
              { userId: actionTarget.userId, reason: values.reason },
              {
                onSuccess: () => {
                  toast.success(actionTarget.action === 'deactivate' ? 'Account deactivated' : 'Account reactivated');
                  setActionTarget(null);
                  reasonForm.reset();
                },
                onError: (error) => toast.error('Action failed', getApiErrorMessage(error)),
              }
            );
          })}
        >
          <div>
            <Label htmlFor="reason" required>
              Reason (audit-logged)
            </Label>
            <Textarea id="reason" {...reasonForm.register('reason')} error={reasonForm.formState.errors.reason?.message} />
            <FieldError>{reasonForm.formState.errors.reason?.message}</FieldError>
          </div>
          <Button type="submit" variant={actionTarget?.action === 'deactivate' ? 'destructive' : 'primary'} className="w-full" isLoading={deactivateUser.isPending || reactivateUser.isPending}>
            Confirm
          </Button>
        </form>
      </Dialog>
    </div>
  );
}
