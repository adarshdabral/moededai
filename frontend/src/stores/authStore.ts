import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TokenPair, UserDTO } from '@/types/api';

interface AuthState {
  user: UserDTO | null;
  accessToken: string | null;
  refreshToken: string | null;
  setSession: (user: UserDTO, tokens: TokenPair) => void;
  setTokens: (tokens: TokenPair) => void;
  updateUser: (user: UserDTO) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setSession: (user, tokens) =>
        set({ user, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }),
      setTokens: (tokens) =>
        set({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }),
      updateUser: (user) => set({ user }),
      clearSession: () => set({ user: null, accessToken: null, refreshToken: null }),
    }),
    { name: 'moded-auth' }
  )
);
