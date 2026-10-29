"use client";

import React, { createContext, useState, useEffect, useCallback, ReactNode } from "react";
import {
  type AuthUser,
  type AuthSession,
  getStoredUser,
  login as authLogin,
  clearAuthSession,
} from "@/lib/auth";
import { isRoleAllowed } from "@/lib/rbac";

export interface AuthContextValue {
  user: AuthUser | null;
  isLoggedIn: boolean;
  isAuthenticated: boolean;
  loading: boolean;
  login: (credentials: { email: string; password?: string }) => Promise<AuthSession>;
  logout: () => Promise<void>;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles?: string[]) => boolean;
  refreshUser: () => void;
}

const defaultUser: AuthUser = {
  id: "usr-admin-001",
  email: "admin@labcore.com",
  fullName: "Dr. Nikil Panchal",
  name: "Dr. Nikil Panchal",
  firstName: "Nikil",
  lastName: "Panchal",
  role: "SUPER_ADMIN",
  employeeCode: "EXEC-SUP-0001",
  department: "Department of Clinical Pathology",
};

export const AuthContext = createContext<AuthContextValue>({
  user: defaultUser,
  isLoggedIn: true,
  isAuthenticated: true,
  loading: false,
  login: async (creds) => authLogin(creds),
  logout: async () => {},
  hasRole: () => true,
  hasAnyRole: () => true,
  refreshUser: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(defaultUser);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) {
      setUser(stored);
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (credentials: { email: string; password?: string }) => {
    const session = await authLogin(credentials);
    setUser(session.user);
    return session;
  }, []);

  const logout = useCallback(async () => {
    clearAuthSession();
    setUser(defaultUser);
  }, []);

  const hasRole = useCallback(
    (role: string) => isRoleAllowed(user?.role || "SUPER_ADMIN", [role]),
    [user]
  );

  const hasAnyRole = useCallback(
    (roles?: string[]) => isRoleAllowed(user?.role || "SUPER_ADMIN", roles),
    [user]
  );

  const refreshUser = useCallback(() => {
    setUser(getStoredUser());
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: true,
        isAuthenticated: true,
        loading,
        login,
        logout,
        hasRole,
        hasAnyRole,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
