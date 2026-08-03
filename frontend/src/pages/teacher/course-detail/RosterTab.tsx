import { useState } from 'react';
import { UserPlus, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useEnrollStudent, useRoster } from '@/hooks/useCourses';
import { toast } from '@/components/ui/toastStore';
import { getApiErrorMessage } from '@/api/client';

const statusVariant = { active: 'correct', completed: 'board', dropped: 'neutral' } as const;

export function RosterTab({ courseId }: { courseId: string }) {
  const { data: roster, isLoading } = useRoster(courseId);
  const enrollStudent = useEnrollStudent(courseId);
  const [studentId, setStudentId] = useState('');

  return (
    <div className="space-y-4">
      <Card>
        <CardContent>
          <Label htmlFor="student-id">Enroll a student</Label>
          <p className="mb-2 text-xs text-ink-muted">
            Ask the student for their Student ID (shown on their Profile page).
          </p>
          <div className="flex gap-2">
            <Input
              id="student-id"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="Student ID"
              className="font-mono"
            />
            <Button
              leftIcon={<UserPlus className="size-4" />}
              isLoading={enrollStudent.isPending}
              disabled={!studentId.trim()}
              onClick={() =>
                enrollStudent.mutate(studentId.trim(), {
                  onSuccess: () => {
                    toast.success('Student enrolled');
                    setStudentId('');
                  },
                  onError: (error) => toast.error('Could not enroll student', getApiErrorMessage(error)),
                })
              }
            >
              Enroll
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading && <Skeleton className="h-24" />}
      {!isLoading && roster?.length === 0 && (
        <EmptyState icon={<Users className="size-8" strokeWidth={1.25} />} title="No students enrolled yet" />
      )}
      <div className="divide-y divide-border rounded-lg border border-border bg-paper-raised">
        {roster?.map((e) => (
          <div key={e.id} className="flex items-center justify-between px-4 py-3">
            <span className="font-mono text-sm text-ink">#{e.studentId.slice(-6)}</span>
            <Badge variant={statusVariant[e.status]}>{e.status}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
