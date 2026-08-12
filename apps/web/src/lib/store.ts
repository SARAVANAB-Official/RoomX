import { create } from 'zustand';
import { supabase } from './supabase';
import { UserRole, UserStatus } from '@roomx/shared';
import type { User } from '@roomx/shared';

interface AuthState {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signInAsGuest: (displayName: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };

    if (data.user) {
      set({
        user: {
          id: data.user.id,
          email: data.user.email || '',
          displayName: data.user.user_metadata?.display_name || data.user.email || 'User',
          avatarUrl: data.user.user_metadata?.avatar_url,
          role: UserRole.MEMBER,
          status: UserStatus.ONLINE,
          createdAt: new Date(data.user.created_at),
          updatedAt: new Date(),
        },
      });
    }
    return {};
  },

  signInAsGuest: async (displayName) => {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) return { error: error.message };

    if (data.user) {
      await supabase.auth.updateUser({ data: { display_name: displayName } });
      set({
        user: {
          id: data.user.id,
          displayName,
          role: UserRole.GUEST,
          status: UserStatus.ONLINE,
          createdAt: new Date(data.user.created_at),
          updatedAt: new Date(),
        },
      });
    }
    return {};
  },

  signUp: async (email, password, displayName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    if (error) return { error: error.message };

    if (data.user) {
      set({
        user: {
          id: data.user.id,
          email: data.user.email || '',
          displayName,
          role: UserRole.MEMBER,
          status: UserStatus.ONLINE,
          createdAt: new Date(data.user.created_at),
          updatedAt: new Date(),
        },
      });
    }
    return {};
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null });
  },

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      set({
        user: {
          id: session.user.id,
          email: session.user.email || '',
          displayName: session.user.user_metadata?.display_name || session.user.email || 'User',
          avatarUrl: session.user.user_metadata?.avatar_url,
          role: UserRole.MEMBER,
          status: UserStatus.ONLINE,
          createdAt: new Date(session.user.created_at),
          updatedAt: new Date(),
        },
        loading: false,
      });
    } else {
      set({ loading: false });
    }

    supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        set({
          user: {
            id: session.user.id,
            email: session.user.email || '',
            displayName: session.user.user_metadata?.display_name || session.user.email || 'User',
            avatarUrl: session.user.user_metadata?.avatar_url,
            role: UserRole.MEMBER,
            status: UserStatus.ONLINE,
            createdAt: new Date(session.user.created_at),
            updatedAt: new Date(),
          },
          loading: false,
        });
      } else {
        set({ user: null, loading: false });
      }
    });
  },
}));
