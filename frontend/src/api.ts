const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('inejoma_auth_token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('inejoma_auth_token', token);
}

export function removeAuthToken() {
  localStorage.removeItem('inejoma_auth_token');
}

export async function apiFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Error HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}
