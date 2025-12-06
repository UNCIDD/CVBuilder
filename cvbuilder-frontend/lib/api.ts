/**
 * API configuration and utilities
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

/**
 * Get the auth token from localStorage
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

/**
 * Set the auth token in localStorage
 */
export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('auth_token', token);
}

/**
 * Remove the auth token from localStorage
 */
export function removeAuthToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('auth_token');
}

/**
 * Make an authenticated API request
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Unauthorized - remove token and redirect to login
      removeAuthToken();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('Unauthorized');
    }

    const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(errorData.error || `Request failed with status ${response.status}`);
  }

  // Handle empty responses
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }

  return response as unknown as T;
}

/**
 * Login and get auth token
 */
export async function login(username: string, password: string): Promise<{ token: string; username: string }> {
  const response = await apiRequest<{ token: string; username: string }>(
    '/api/accounts/login/',
    {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }
  );

  if (response.token) {
    setAuthToken(response.token);
  }

  return response;
}
/**
 * Register a new user and get auth token
 */
export async function register(username: string, password: string): Promise<{ token: string; user_id: number }> {
  const response = await apiRequest<{ token: string; user_id: number }>(
    '/api/accounts/register/',
    {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }
  );

  if (response.token) {
    setAuthToken(response.token);
  }

  return response;
}
/**
 * Logout (remove token)
 */
export function logout(): void {
  removeAuthToken();
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}

