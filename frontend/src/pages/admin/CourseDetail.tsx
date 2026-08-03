import { useParams } from 'react-router-dom';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { useCourse, useUpdateCourse } from '@/hooks/useCourses';
import { TopicsTab } from '@/pages/teacher/course-detail/TopicsTab';
import { AssignmentsTab } from '@/pages/teacher/course-detail/AssignmentsTab';
import { LearningPathTab } from '@/pages/teacher/course-detail/LearningPathTab';
import { RosterTab } from '@/pages/teacher/course-detail/RosterTab';
import { AssessmentsTab } from '@/pages/teacher/course-detail/AssessmentsTab';
import { toast } from '@/components/ui/toastStore';
import { getApiErrorMessage } from '@/api/client';

export function AdminCourseDetailPage() {
  const { courseId } = useParams();
  const { data: course, isLoading } = useCourse(courseId);
  const updateCourse = useUpdateCourse(courseId ?? '');

  if (isLoading || !course) return <Skeleton className="h-64" />;

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Courses', to: '/admin/courses' }, { label: course.title }]} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Badge variant="board">{course.subject}</Badge>
          <h1 className="mt-2 font-display text-3xl font-medium text-ink">{course.title}</h1>
          {course.description && <p className="mt-2 max-w-2xl text-ink-muted">{course.description}</p>}
        </div>
        <Button
          variant={course.isPublished ? 'outline' : 'primary'}
          isLoading={updateCourse.isPending}
          onClick={() =>
            updateCourse.mutate(
              { isPublished: !course.isPublished },
              {
                onSuccess: () => toast.success(course.isPublished ? 'Course unpublished' : 'Course published'),
                onError: (error) => toast.error('Could not update course', getApiErrorMessage(error)),
              }
            )
          }
        >
          {course.isPublished ? 'Unpublish' : 'Publish'}
        </Button>
      </div>

      <Tabs defaultValue="topics">
        <TabsList>
          <TabsTrigger value="topics">Topics</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="learning-path">Learning Path</TabsTrigger>
          <TabsTrigger value="roster">Roster</TabsTrigger>
          <TabsTrigger value="assessments">Assessments</TabsTrigger>
        </TabsList>
        <TabsContent value="topics">
          <TopicsTab courseId={course.id} />
        </TabsContent>
        <TabsContent value="assignments">
          <AssignmentsTab courseId={course.id} />
        </TabsContent>
        <TabsContent value="learning-path">
          <LearningPathTab courseId={course.id} />
        </TabsContent>
        <TabsContent value="roster">
          <RosterTab courseId={course.id} />
        </TabsContent>
        <TabsContent value="assessments">
          <AssessmentsTab courseId={course.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
