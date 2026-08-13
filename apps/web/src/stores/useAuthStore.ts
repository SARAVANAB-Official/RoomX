import { create } from 'zustand';
import { UserRole, UserStatus } from '@roomx/shared';
import type { User } from '@roomx/shared';
import { supabase } from '@/lib/supabase';
import { makeApi } from '@/lib/api';

interface Session {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at?: number;
  token_type: string;
  user: any;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error?: string }>;
  signInAsGuest: (displayName: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

const mapSupabaseUser = (sbUser: any): User => ({
  id: sbUser.id,
  displayName: sbUser.user_metadata?.display_name || sbUser.email?.split('@')[0] || 'Anonymous',
  email: sbUser.email,
  avatarUrl: sbUser.user_metadata?.avatar_url,
  role: sbUser.user_metadata?.role || UserRole.MEMBER,
  status: UserStatus.ONLINE,
  createdAt: new Date(sbUser.created_at),
  updatedAt: new Date(sbUser.updated_at || sbUser.created_at),
  lastSeenAt: new Date(),
});

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: false,
  initialized: false,

  setUser: (user) => set({ user }),

  setSession: (session) => set({ session }),

  signIn: async (email, password) => {
    set({ loading: true });
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    set({ loading: false });
    if (error) return { error: error.message };
    if (data.user) set({ user: mapSupabaseUser(data.user), session: data.session as any });
    return {};
  },

  signUp: async (email, password, displayName) => {
    set({ loading: true });
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    set({ loading: false });
    if (error) return { error: error.message };
    if (data.user) set({ user: mapSupabaseUser(data.user), session: data.session as any });
    return {};
  },

  signInAsGuest: async (displayName) => {
    set({ loading: true });
    try {
      const result = await makeApi<{ user: any; session: any }>('/api/auth/guest', {
        method: 'POST',
        body: JSON.stringify({ displayName }),
      });
      set({ loading: false });
      if (result.user) set({ user: mapSupabaseUser(result.user), session: result.session as any });
      return {};
    } catch (err) {
      set({ loading: false });
      return { error: err instanceof Error ? err.message : 'Guest login failed' };
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null });
  },

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      set({
        session: session as any,
        user: mapSupabaseUser(session.user),
        initialized: true,
      });
    } else {
      set({ initialized: true });
    }

    supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        set({ session: session as any, user: mapSupabaseUser(session.user) });
      } else {
        set({ user: null, session: null });
      }
    });
  },
}));
