import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Download, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Label, Textarea, FieldError } from '@/components/ui/Input';
import { Dialog } from '@/components/ui/Dialog';
import { FileDropzone } from '@/components/upload/FileDropzone';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAssignments, useCreateAssignment, useDeleteAssignment } from '@/hooks/useCourses';
import { toast } from '@/components/ui/toastStore';
import { getApiErrorMessage } from '@/api/client';

const schema = z.object({
  title: z.string().min(1).max(150),
  description: z.string().min(1).max(5000),
  dueAt: z.string().min(1, 'Pick a due date.'),
});
type FormValues = z.infer<typeof schema>;

export function AssignmentsTab({ courseId }: { courseId: string }) {
  const { data: assignments, isLoading } = useAssignments(courseId);
  const createAssignment = useCreateAssignment(courseId);
  const deleteAssignment = useDeleteAssignment(courseId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button leftIcon={<Plus className="size-4" />} onClick={() => setDialogOpen(true)}>
          New assignment
        </Button>
      </div>

      {isLoading && <Skeleton className="h-24" />}
      {!isLoading && assignments?.length === 0 && (
        <EmptyState title="No assignments yet" description="Create one to give students graded work." />
      )}

      <div className="space-y-3">
        {assignments?.map((a) => (
          <Card key={a.id}>
            <CardContent className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-medium text-ink">{a.title}</h3>
                <p className="mt-1 text-sm text-ink-muted">{a.description}</p>
                <p className="mt-2 text-xs text-ink-faint">
                  Due {new Date(a.dueAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {a.attachmentUrl && (
                  <a href={a.attachmentUrl} target="_blank" rel="noreferrer" className="text-board hover:text-board-strong">
                    <Download className="size-4" />
                  </a>
                )}
                <button onClick={() => deleteAssignment.mutate(a.id)} aria-label="Delete assignment" className="text-ink-faint hover:text-flag">
                  <Trash2 className="size-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="New assignment">
        <form
          className="space-y-4"
          onSubmit={handleSubmit((values) =>
            createAssignment.mutate(
              { ...values, dueAt: new Date(values.dueAt).toISOString(), file: file ?? undefined, onProgress: setProgress },
              {
                onSuccess: () => {
                  toast.success('Assignment created');
                  setDialogOpen(false);
                  reset();
                  setFile(null);
                },
                onError: (error) => toast.error('Could not create assignment', getApiErrorMessage(error)),
              }
            )
          )}
        >
          <div>
            <Label htmlFor="a-title" required>
              Title
            </Label>
            <Input id="a-title" {...register('title')} error={errors.title?.message} />
            <FieldError>{errors.title?.message}</FieldError>
          </div>
          <div>
            <Label htmlFor="a-description" required>
              Description
            </Label>
            <Textarea id="a-description" {...register('description')} error={errors.description?.message} />
            <FieldError>{errors.description?.message}</FieldError>
          </div>
          <div>
            <Label htmlFor="a-dueAt" required>
              Due date
            </Label>
            <Input id="a-dueAt" type="datetime-local" {...register('dueAt')} error={errors.dueAt?.message} />
            <FieldError>{errors.dueAt?.message}</FieldError>
          </div>
          <div>
            <Label>Attachment (optional)</Label>
            <FileDropzone
              selectedFile={file}
              onFileSelected={setFile}
              onClear={() => setFile(null)}
              uploadProgress={createAssignment.isPending ? progress : undefined}
            />
          </div>
          <Button type="submit" className="w-full" isLoading={createAssignment.isPending}>
            Create assignment
          </Button>
        </form>
      </Dialog>
    </div>
  );
}
