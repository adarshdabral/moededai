import { useMemo } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import * as teacherApi from '@/api/teacher';
import * as coursesApi from '@/api/courses';

export function useMyClasses() {
  return useQuery({ queryKey: ['teacher', 'classes'], queryFn: teacherApi.getMyClasses });
}

export interface RosterEntry {
  studentId: string;
  courseIds: string[];
}

/**
 * The backend has no "list all my students" endpoint, and enrollment
 * records carry only a studentId (no GET /users/:id exists for a teacher to
 * resolve a name from it - see frontend README "Known limitations"). This
 * aggregates real roster data across the teacher's own classes and dedupes
 * by student, which is the most this API surface can support.
 */
export function useAllMyStudents() {
  const { data: classes, isLoading: classesLoading } = useMyClasses();
  const courseIds = useMemo(() => classes?.map((c) => c.id) ?? [], [classes]);

  const rosterResults = useQueries({
    queries: courseIds.map((courseId) => ({
      queryKey: ['roster', courseId],
      queryFn: () => coursesApi.listRoster(courseId),
    })),
  });

  const students = useMemo(() => {
    const map = new Map<string, RosterEntry>();
    rosterResults.forEach((result, i) => {
      result.data
        ?.filter((e) => e.status === 'active')
        .forEach((enrollment) => {
          const existing = map.get(enrollment.studentId);
          if (existing) {
            existing.courseIds.push(courseIds[i]);
          } else {
            map.set(enrollment.studentId, { studentId: enrollment.studentId, courseIds: [courseIds[i]] });
          }
        });
    });
    return Array.from(map.values());
  }, [rosterResults, courseIds]);

  return { students, isLoading: classesLoading || rosterResults.some((r) => r.isLoading) };
}

export function useStudentAnalytics(studentId: string | undefined) {
  return useQuery({
    queryKey: ['teacher', 'student-analytics', studentId],
    queryFn: () => teacherApi.getStudentAnalytics(studentId!),
    enabled: Boolean(studentId),
  });
}
