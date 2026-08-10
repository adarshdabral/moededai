import { Link } from 'react-router-dom';
import { GraduationCap, MessageCircleQuestion, Users } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { KnowledgeScoreGauge } from '@/components/knowledge-score/KnowledgeScoreGauge';
import { MagnitudeBarChart } from '@/components/charts/MagnitudeBarChart';
import { useMe } from '@/hooks/useUser';
import {
  useAllMyStudents,
  useClassProgress,
  useMyClasses,
  usePendingDoubts,
  useUpcomingAssignments,
} from '@/hooks/useTeacher';

function StatCard({ label, value, isLoading }: { label: string; value: number; isLoading: boolean }) {
  return (
    <Card className="p-5">
      <p className="eyebrow">{label}</p>
      {isLoading ? <Skeleton className="mt-2 h-9 w-16" /> : <p className="mt-1 font-display text-4xl font-medium text-ink">{value}</p>}
    </Card>
  );
}

export function TeacherDashboardPage() {
  const { data: user } = useMe();
  const { data: classes, isLoading: classesLoading } = useMyClasses();
  const { students, isLoading: studentsLoading } = useAllMyStudents();
  const { doubts, isLoading: doubtsLoading } = usePendingDoubts();
  const { upcoming, isLoading: assignmentsLoading } = useUpcomingAssignments();
  const { classAverages, overallAverage, isLoading: progressLoading } = useClassProgress();

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Dashboard</p>
        <h1 className="mt-1 font-display text-3xl font-medium text-ink">
          Welcome back{user ? `, ${user.name.split(' ')[0]}` : ''}
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Classes" value={classes?.length ?? 0} isLoading={classesLoading} />
        <StatCard label="Students" value={students.length} isLoading={studentsLoading} />
        <StatCard label="Open doubts" value={doubts.length} isLoading={doubtsLoading} />
        <Card className="flex items-center gap-3 p-5">
          <div>
            <p className="eyebrow">Avg. class score</p>
            {progressLoading ? (
              <Skeleton className="mt-2 h-9 w-16" />
            ) : (
              <p className="mt-1 font-display text-4xl font-medium text-ink">{overallAverage}</p>
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Class progress"
            description="Average Knowledge Score per class."
            action={
              <Link to="/teacher/reports" className="text-sm font-medium text-board hover:underline">
                Full reports
              </Link>
            }
          />
          <CardContent>
            {progressLoading && <Skeleton className="h-56" />}
            {!progressLoading && classAverages.length === 0 && (
              <EmptyState
                icon={<GraduationCap className="size-8" strokeWidth={1.25} />}
                title="No classes yet"
                description="Create a course to see progress here."
              />
            )}
            {classAverages.length > 0 && (
              <MagnitudeBarChart
                data={classAverages.map((c) => ({ label: c.title, value: c.averageScore }))}
                warnBelow={60}
              />
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col items-center justify-center gap-2 p-6">
          <KnowledgeScoreGauge score={overallAverage} label="Overall average" size="lg" />
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Pending doubts"
            action={
              <Link to="/teacher/doubts" className="text-sm font-medium text-board hover:underline">
                View inbox
              </Link>
            }
          />
          <CardContent>
            {doubtsLoading && <Skeleton className="h-24" />}
            {!doubtsLoading && doubts.length === 0 && (
              <EmptyState
                icon={<MessageCircleQuestion className="size-8" strokeWidth={1.25} />}
                title="Inbox zero"
                description="No open doubts right now."
              />
            )}
            <ul className="divide-y divide-border">
              {doubts.slice(0, 5).map((d) => (
                <li key={d.id}>
                  <Link to={`/teacher/doubts/${d.id}`} className="block py-2.5 hover:text-board">
                    <p className="truncate text-sm text-ink">{d.question}</p>
                    <p className="mt-0.5 text-xs text-ink-faint">{d.courseTitle}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Assignments due soon" />
          <CardContent>
            {assignmentsLoading && <Skeleton className="h-24" />}
            {!assignmentsLoading && upcoming.length === 0 && (
              <EmptyState title="Nothing due" description="No upcoming assignment deadlines." />
            )}
            <ul className="divide-y divide-border">
              {upcoming.slice(0, 5).map((a) => (
                <li key={a.id} className="flex items-center justify-between py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-ink">{a.title}</p>
                    <p className="text-xs text-ink-faint">{a.courseTitle}</p>
                  </div>
                  <Badge variant="neutral" className="shrink-0">
                    {new Date(a.dueAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="eyebrow">Your classes</p>
          <Link to="/teacher/students" className="flex items-center gap-1.5 text-sm font-medium text-board hover:underline">
            <Users className="size-4" />
            View all students
          </Link>
        </div>
        {classesLoading && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        )}
        {!classesLoading && classes?.length === 0 && (
          <EmptyState
            icon={<GraduationCap className="size-8" strokeWidth={1.25} />}
            title="No classes yet"
            description="Create a course to get started."
            action={
              <Link
                to="/teacher/courses"
                className="inline-flex h-9 items-center rounded-md bg-board px-4 text-sm font-medium text-paper hover:bg-board-strong"
              >
                Create a course
              </Link>
            }
          />
        )}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {classes?.map((course) => (
            <Link key={course.id} to={`/teacher/courses/${course.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant="board">{course.subject}</Badge>
                    {!course.isPublished && <Badge variant="neutral">Draft</Badge>}
                  </div>
                  <h3 className="mt-2 font-display text-lg font-medium text-ink">{course.title}</h3>
                  <p className="mt-1 text-xs text-ink-faint">{course.gradeLevel}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
