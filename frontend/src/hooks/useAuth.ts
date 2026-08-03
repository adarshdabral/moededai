import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import * as authApi from '@/api/auth';
import { useAuthStore } from '@/stores/authStore';

export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (result) => {
      setSession(result.user, result.tokens);
      navigate(`/${result.user.role}`, { replace: true });
    },
  });
}

export function useRegister() {
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (result) => {
      setSession(result.user, result.tokens);
      navigate('/student', { replace: true });
    },
  });
}

export function useLogout() {
  const { refreshToken, clearSession } = useAuthStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async () => {
      if (refreshToken) await authApi.logout(refreshToken);
    },
    onSettled: () => {
      clearSession();
      navigate('/login', { replace: true });
    },
  });
}

export function useRequestPasswordReset() {
  return useMutation({ mutationFn: authApi.requestPasswordReset });
}

export function useResetPassword() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (input: { token: string; newPassword: string }) =>
      authApi.resetPassword(input.token, input.newPassword),
    onSuccess: () => navigate('/login', { replace: true }),
  });
}
