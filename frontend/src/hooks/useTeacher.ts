import { useMemo } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import * as teacherApi from '@/api/teacher';
import * as coursesApi from '@/api/courses';
import * as doubtsApi from '@/api/doubts';
import * as analyticsApi from '@/api/analytics';
import type { AssignmentDTO, DoubtDTO } from '@/types/domain';

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

export interface PendingDoubtEntry extends DoubtDTO {
  courseTitle: string;
}

/** Open doubts across every one of the teacher's classes - there is no cross-course endpoint, so this aggregates per-course. */
export function usePendingDoubts() {
  const { data: classes, isLoading: classesLoading } = useMyClasses();
  const courseIds = useMemo(() => classes?.map((c) => c.id) ?? [], [classes]);

  const results = useQueries({
    queries: courseIds.map((courseId) => ({
      queryKey: ['doubts', 'course', courseId, 'open'],
      queryFn: () => doubtsApi.listCourseDoubts(courseId, 'open'),
    })),
  });

  const doubts = useMemo(() => {
    const all: PendingDoubtEntry[] = [];
    results.forEach((result, i) => {
      result.data?.forEach((d) =>
        all.push({ ...d, courseTitle: classes?.[i]?.title ?? 'Course' })
      );
    });
    return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [results, classes]);

  return { doubts, isLoading: classesLoading || results.some((r) => r.isLoading) };
}

export interface UpcomingAssignmentEntry extends AssignmentDTO {
  courseTitle: string;
}

/** Assignments due soon across every one of the teacher's classes. */
export function useUpcomingAssignments() {
  const { data: classes, isLoading: classesLoading } = useMyClasses();
  const courseIds = useMemo(() => classes?.map((c) => c.id) ?? [], [classes]);

  const results = useQueries({
    queries: courseIds.map((courseId) => ({
      queryKey: ['assignments', courseId],
      queryFn: () => coursesApi.listAssignments(courseId),
    })),
  });

  const upcoming = useMemo(() => {
    const all: UpcomingAssignmentEntry[] = [];
    const now = Date.now();
    results.forEach((result, i) => {
      result.data?.forEach((a) => {
        if (new Date(a.dueAt).getTime() >= now) {
          all.push({ ...a, courseTitle: classes?.[i]?.title ?? 'Course' });
        }
      });
    });
    return all.sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
  }, [results, classes]);

  return { upcoming, isLoading: classesLoading || results.some((r) => r.isLoading) };
}

export interface ClassProgressEntry {
  courseId: string;
  title: string;
  averageScore: number;
  studentCount: number;
}

/** Per-class average Knowledge Score, reusing the same comparative-report endpoint as the Reports page. */
export function useClassProgress() {
  const { data: classes, isLoading: classesLoading } = useMyClasses();
  const courseIds = useMemo(() => classes?.map((c) => c.id) ?? [], [classes]);

  const results = useQueries({
    queries: courseIds.map((courseId) => ({
      queryKey: ['analytics', 'comparative', courseId],
      queryFn: () => analyticsApi.getCourseComparative(courseId),
    })),
  });

  const classAverages = useMemo<ClassProgressEntry[]>(
    () =>
      courseIds.map((courseId, i) => {
        const rows = results[i]?.data ?? [];
        const averageScore = rows.length
          ? Math.round((rows.reduce((sum, r) => sum + r.averageScore, 0) / rows.length) * 100) / 100
          : 0;
        return { courseId, title: classes?.[i]?.title ?? 'Course', averageScore, studentCount: rows.length };
      }),
    [results, courseIds, classes]
  );

  const overallAverage = classAverages.length
    ? Math.round(
        (classAverages.reduce((sum, c) => sum + c.averageScore, 0) / classAverages.length) * 100
      ) / 100
    : 0;

  return { classAverages, overallAverage, isLoading: classesLoading || results.some((r) => r.isLoading) };
}
