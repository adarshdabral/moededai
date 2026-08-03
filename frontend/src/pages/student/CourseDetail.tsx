import { Link, useParams } from 'react-router-dom';
import { Download, ListOrdered } from 'lucide-react';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { useAssignments, useCourse, useLearningPaths, useTopics } from '@/hooks/useCourses';

export function StudentCourseDetailPage() {
  const { courseId } = useParams();
  const { data: course, isLoading: courseLoading } = useCourse(courseId);
  const { data: topics, isLoading: topicsLoading } = useTopics(courseId);
  const { data: assignments } = useAssignments(courseId);
  const { data: learningPaths } = useLearningPaths(courseId);

  if (courseLoading) return <Skeleton className="h-64" />;
  if (!course) return null;

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Courses', to: '/student/courses' }, { label: course.title }]} />

      <div>
        <Badge variant="board">{course.subject}</Badge>
        <h1 className="mt-2 font-display text-3xl font-medium text-ink">{course.title}</h1>
        {course.description && <p className="mt-2 max-w-2xl text-ink-muted">{course.description}</p>}
      </div>

      <Tabs defaultValue="topics">
        <TabsList>
          <TabsTrigger value="topics">Topics</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="learning-path">Learning Path</TabsTrigger>
        </TabsList>

        <TabsContent value="topics">
          {topicsLoading && <Skeleton className="h-40" />}
          {!topicsLoading && topics?.length === 0 && (
            <EmptyState title="No topics yet" description="Your teacher hasn't added any topics to this course." />
          )}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {topics?.map((topic) => (
              <Link key={topic.id} to={`/student/courses/${course.id}/topics/${topic.id}`}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardContent>
                    <p className="eyebrow">Topic {topic.order}</p>
                    <h3 className="mt-1 font-display text-base font-medium text-ink">{topic.title}</h3>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="assignments">
          {assignments?.length === 0 && (
            <EmptyState title="No assignments yet" description="Assignments posted by your teacher will appear here." />
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
                  {a.attachmentUrl && (
                    <a
                      href={a.attachmentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-board hover:underline"
                    >
                      <Download className="size-4" />
                      Attachment
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="learning-path">
          {learningPaths?.length === 0 && (
            <EmptyState title="No learning path yet" description="Your teacher hasn't published a sequence for this course." />
          )}
          <div className="space-y-4">
            {learningPaths?.map((path) => (
              <Card key={path.id}>
                <CardContent>
                  <h3 className="flex items-center gap-2 font-medium text-ink">
                    <ListOrdered className="size-4 text-board" />
                    {path.title}
                  </h3>
                  <ol className="mt-3 space-y-2">
                    {path.topicSequence.map((topicId, i) => {
                      const topic = topics?.find((t) => t.id === topicId);
                      return (
                        <li key={topicId} className="flex items-center gap-2 text-sm text-ink-muted">
                          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-board-soft font-mono text-xs text-board-strong">
                            {i + 1}
                          </span>
                          {topic?.title ?? topicId}
                        </li>
                      );
                    })}
                  </ol>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
