import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';
import * as coursesApi from '@/api/courses';

export interface TopicLookupEntry {
  title: string;
  courseId: string;
}

/**
 * The knowledge-score and assessment endpoints return a bare topicId with no
 * enrichment (there is no GET /topics/:id in the backend - topics are only
 * ever listed nested under a course). This resolves topic titles client-side
 * by fetching each course's topic list once and joining locally - real data
 * from real endpoints, just joined outside the database.
 */
export function useTopicLookup(courseIds: string[]) {
  const uniqueIds = useMemo(() => Array.from(new Set(courseIds)), [courseIds]);

  const results = useQueries({
    queries: uniqueIds.map((courseId) => ({
      queryKey: ['topics', courseId],
      queryFn: () => coursesApi.listTopics(courseId),
      enabled: Boolean(courseId),
    })),
  });

  const map = useMemo(() => {
    const m = new Map<string, TopicLookupEntry>();
    results.forEach((result, i) => {
      result.data?.forEach((topic) => {
        m.set(topic.id, { title: topic.title, courseId: uniqueIds[i] });
      });
    });
    return m;
  }, [results, uniqueIds]);

  const isLoading = results.some((r) => r.isLoading);

  return { topicMap: map, isLoading };
}
