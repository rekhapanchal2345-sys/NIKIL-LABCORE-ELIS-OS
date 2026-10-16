/**
 * Single place that knows where login data lives in the browser.
 *
 * "Keep session" (remember me) decides the store: persistent data goes to
 * localStorage, otherwise it lives in sessionStorage and dies with the tab.
 * Reading falls back to localStorage so sessions created before this change
 * keep working, and clearing always wipes both stores.
 */

export const ACCESS_TOKEN_KEY = "accessToken";
export const LEGACY_TOKEN_KEY = "token";
export const REFRESH_TOKEN_KEY = "refreshToken";
export const USER_KEY = "labcore_user";
export const AUTH_KEY = "labcore_auth";
export const REMEMBER_ME_KEY = "labcore_remember_me";
export const PRIVACY_MODE_KEY = "labcore_privacy_mode";

const AUTH_KEYS = [
  ACCESS_TOKEN_KEY,
  LEGACY_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  USER_KEY,
  AUTH_KEY,
];

function stores(): Storage[] {
  if (typeof window === "undefined") return [];
  return [window.sessionStorage, window.localStorage].filter(
    (store) => store !== undefined && store !== null
  ) as Storage[];
}

export function isRememberMe(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(REMEMBER_ME_KEY) === "true";
  } catch {
    return false;
  }
}

export function setRememberMe(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(REMEMBER_ME_KEY, String(enabled));
  } catch {
    /* storage disabled (private browsing) */
  }
}

export function readAuth(key: string): string | null {
  for (const store of stores()) {
    try {
      const value = store.getItem(key);
      if (value) return value;
    } catch {
      /* ignore unreadable store */
    }
  }
  return null;
}

export function writeAuth(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
    window.sessionStorage.setItem(key, value);

    if (key === ACCESS_TOKEN_KEY || key === LEGACY_TOKEN_KEY) {
      document.cookie = `accessToken=${encodeURIComponent(value)}; path=/; max-age=604800; SameSite=Lax`;
      document.cookie = `token=${encodeURIComponent(value)}; path=/; max-age=604800; SameSite=Lax`;
    }
  } catch {
    /* ignore quota errors */
  }
}

/** Removes the key from every store, so no half-cleared session survives logout. */
export function eraseAuth(key: string): void {
  for (const store of stores()) {
    try {
      store.removeItem(key);
    } catch {
      /* ignore */
    }
  }
  if (typeof document !== "undefined") {
    document.cookie = `${key}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    if (key === ACCESS_TOKEN_KEY || key === LEGACY_TOKEN_KEY) {
      document.cookie = "accessToken=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
  }
}

export function clearAuthEntries(): void {
  AUTH_KEYS.forEach(eraseAuth);
}

export function getAccessToken(): string | null {
  return (
    readAuth(ACCESS_TOKEN_KEY) ||
    readAuth(LEGACY_TOKEN_KEY) ||
    (() => {
      const raw = readAuth(AUTH_KEY);
      if (!raw) return null;
      try {
        const parsed = JSON.parse(raw) as {
          accessToken?: string;
          token?: string;
        };
        return parsed.accessToken || parsed.token || null;
      } catch {
        return null;
      }
    })()
  );
}

export function getRefreshToken(): string | null {
  return readAuth(REFRESH_TOKEN_KEY);
}
