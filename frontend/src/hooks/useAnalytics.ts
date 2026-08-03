import { useQuery } from '@tanstack/react-query';
import * as analyticsApi from '@/api/analytics';

export function useMyGrowth() {
  return useQuery({ queryKey: ['analytics', 'me'], queryFn: analyticsApi.getMyGrowth });
}

export function useCourseComparative(courseId: string | undefined) {
  return useQuery({
    queryKey: ['analytics', 'comparative', courseId],
    queryFn: () => analyticsApi.getCourseComparative(courseId!),
    enabled: Boolean(courseId),
  });
}
