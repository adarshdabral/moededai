import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as adminApi from '@/api/admin';
import type { ListUsersParams } from '@/api/admin';

export function useAdminUsers(params: ListUsersParams = {}) {
  return useQuery({ queryKey: ['admin', 'users', params], queryFn: () => adminApi.listUsers(params) });
}

export function useCreatePrivilegedUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApi.createPrivilegedUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
}

export function useDeactivateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { userId: string; reason: string }) =>
      adminApi.deactivateUser(input.userId, input.reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
}

export function useReactivateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { userId: string; reason: string }) =>
      adminApi.reactivateUser(input.userId, input.reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
}

export function useResolveIdentity() {
  return useMutation({
    mutationFn: (input: { anonymousId: string; reason: string }) =>
      adminApi.resolveIdentity(input.anonymousId, input.reason),
  });
}

export function useAuditLogs(page = 1) {
  return useQuery({ queryKey: ['admin', 'audit-logs', page], queryFn: () => adminApi.listAuditLogs(page) });
}

export function usePlatformSettings() {
  return useQuery({ queryKey: ['admin', 'settings'], queryFn: adminApi.getPlatformSettings });
}

export function useUpdatePlatformSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApi.updatePlatformSettings,
    onSuccess: (settings) => queryClient.setQueryData(['admin', 'settings'], settings),
  });
}
