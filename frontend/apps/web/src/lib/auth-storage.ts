const ACCESS_TOKEN_KEY = "labcore_access_token";
const USER_STORAGE_KEY = "labcore_auth_user";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return "demo-session-token";
  return localStorage.getItem(ACCESS_TOKEN_KEY) || "demo-session-token";
}

export function setAccessToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearAccessToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
}
