import { useEffect } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const initialized = useAuthStore((s) => s.initialized);
  const signIn = useAuthStore((s) => s.signIn);
  const signUp = useAuthStore((s) => s.signUp);
  const signInAsGuest = useAuthStore((s) => s.signInAsGuest);
  const signOut = useAuthStore((s) => s.signOut);
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    if (!initialized) {
      initialize();
    }
  }, [initialized, initialize]);

  return {
    user,
    loading,
    initialized,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signInAsGuest,
    signOut,
  };
}
