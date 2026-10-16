import type { User } from "@/types/user";
import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  USER_KEY,
} from "@/lib/constants";

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(access: string, refresh?: string | null): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, access);
  if (refresh) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  }
}

export function getStoredUser(): User | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function setStoredUser(user: User | null): void {
  if (!user) {
    localStorage.removeItem(USER_KEY);
    return;
  }
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function saveSession(input: {
  accessToken: string;
  refreshToken: string;
  user: User;
}): void {
  setTokens(input.accessToken, input.refreshToken);
  setStoredUser(input.user);
}

export function clearSession(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isLoggedIn(): boolean {
  return Boolean(getAccessToken() || getRefreshToken());
}
