import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as usersApi from '@/api/users';
import { useAuthStore } from '@/stores/authStore';

export function useMe() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['me'],
    queryFn: usersApi.getMe,
    initialData: user ?? undefined,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((s) => s.updateUser);
  return useMutation({
    mutationFn: usersApi.updateMe,
    onSuccess: (user) => {
      updateUser(user);
      queryClient.setQueryData(['me'], user);
    },
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((s) => s.updateUser);
  return useMutation({
    mutationFn: usersApi.uploadAvatar,
    onSuccess: (user) => {
      updateUser(user);
      queryClient.setQueryData(['me'], user);
    },
  });
}
