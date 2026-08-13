import { supabase } from './supabase';
import { useAuthStore } from '@/stores/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

async function getAuthToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  if (data.session?.access_token) return data.session.access_token;

  const storeSession = useAuthStore.getState().session;
  if (storeSession?.access_token) return storeSession.access_token;

  return null;
}

export async function makeApi<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_URL.replace(/\/+$/, '')}${path}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (err) {
    throw new ApiError(
      'Unable to connect to the server. Please check your connection.',
      0,
      null,
    );
  }

  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');
  const body = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const errorMessage = typeof body === 'string'
      ? body
      : body?.error?.message ?? body?.message ?? `Request failed (${response.status})`;
    throw new ApiError(errorMessage, response.status, body);
  }

  if (isJson && body && typeof body === 'object' && 'data' in body) {
    return body.data as T;
  }

  return body as T;
}

export function attachToken(token: string): void {
  supabase.realtime.setAuth(token);
}

export async function detachToken(): Promise<void> {
  await supabase.auth.signOut();
}
