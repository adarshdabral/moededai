import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { GraduationCap, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Dialog } from '@/components/ui/Dialog';
import { Input, Label, FieldError, Textarea } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useMyClasses } from '@/hooks/useTeacher';
import { useCreateCourse } from '@/hooks/useCourses';
import { useMe } from '@/hooks/useUser';
import { toast } from '@/components/ui/toastStore';
import { getApiErrorMessage } from '@/api/client';

const schema = z.object({
  title: z.string().min(3).max(150),
  subject: z.string().min(1).max(100),
  gradeLevel: z.string().min(1).max(50),
  description: z.string().max(2000).optional(),
});
type FormValues = z.infer<typeof schema>;

export function TeacherCoursesPage() {
  const { data: classes, isLoading, refetch } = useMyClasses();
  const { data: me } = useMe();
  const createCourse = useCreateCourse();
  const [dialogOpen, setDialogOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow">Courses</p>
          <h1 className="mt-1 font-display text-3xl font-medium text-ink">Your courses</h1>
        </div>
        <Button leftIcon={<Plus className="size-4" />} onClick={() => setDialogOpen(true)}>
          New course
        </Button>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      )}

      {!isLoading && classes?.length === 0 && (
        <EmptyState
          icon={<GraduationCap className="size-8" strokeWidth={1.25} />}
          title="No courses yet"
          description="Create your first course to start adding topics and resources."
        />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {classes?.map((course) => (
          <Link key={course.id} to={`/teacher/courses/${course.id}`}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge variant="board">{course.subject}</Badge>
                  <Badge variant={course.isPublished ? 'correct' : 'neutral'}>
                    {course.isPublished ? 'Published' : 'Draft'}
                  </Badge>
                </div>
                <h3 className="mt-2 font-display text-lg font-medium text-ink">{course.title}</h3>
                <p className="mt-1 text-xs text-ink-faint">{course.gradeLevel}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="Create a course">
        <form
          className="space-y-4"
          onSubmit={handleSubmit((values) =>
            createCourse.mutate(
              // teacherIds is required non-empty by the API, but the backend
              // always overrides it to [requester.id] for a teacher caller -
              // this placeholder value is never actually persisted as-is.
              { ...values, teacherIds: me ? [me.id] : [] },
              {
                onSuccess: () => {
                  toast.success('Course created');
                  setDialogOpen(false);
                  reset();
                  refetch();
                },
                onError: (error) => toast.error('Could not create course', getApiErrorMessage(error)),
              }
            )
          )}
        >
          <div>
            <Label htmlFor="title" required>
              Title
            </Label>
            <Input id="title" {...register('title')} error={errors.title?.message} />
            <FieldError>{errors.title?.message}</FieldError>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="subject" required>
                Subject
              </Label>
              <Input id="subject" {...register('subject')} error={errors.subject?.message} />
              <FieldError>{errors.subject?.message}</FieldError>
            </div>
            <div>
              <Label htmlFor="gradeLevel" required>
                Grade level
              </Label>
              <Input id="gradeLevel" placeholder="Grade 9" {...register('gradeLevel')} error={errors.gradeLevel?.message} />
              <FieldError>{errors.gradeLevel?.message}</FieldError>
            </div>
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...register('description')} />
          </div>
          <Button type="submit" className="w-full" isLoading={createCourse.isPending}>
            Create course
          </Button>
        </form>
      </Dialog>
    </div>
  );
}
