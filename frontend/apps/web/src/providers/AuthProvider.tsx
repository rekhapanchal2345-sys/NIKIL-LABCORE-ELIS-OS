"use client";

import { ReactNode, useEffect } from "react";
import { useAuthInternal, AuthContext } from "@/hooks/useAuth";
import { useRouter, usePathname } from "next/navigation";

interface AuthProviderProps {
  children: ReactNode;
}

// Routes reachable without a completed sign-in.
const PUBLIC_ROUTES = [
  "/login",
  "/forgot-password",
  "/register",
  "/unauthorized",
  "/mfa-setup",
];

export function AuthProvider({ children }: AuthProviderProps) {
  const auth = useAuthInternal();
  const { isLoggedIn, loading } = auth;
  const router = useRouter();
  const pathname = usePathname();

  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  useEffect(() => {
    if (loading) return;

    // Unauthenticated user attempting to access protected route -> redirect to login
    if (!isLoggedIn && !isPublicRoute && pathname !== "/") {
      router.replace("/login");
      return;
    }

    // Already logged in user attempting to access login/forgot-password/root -> redirect to dashboard
    if (isLoggedIn && (pathname === "/login" || pathname === "/forgot-password" || pathname === "/")) {
      router.replace("/dashboard");
    }
  }, [isPublicRoute, isLoggedIn, loading, pathname, router]);

  // On protected routes, block unauthenticated access from rendering protected children
  if (!isPublicRoute && pathname !== "/" && (loading || !isLoggedIn)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020306]">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent mx-auto" />
          <p className="text-sm font-mono text-white/50">
            {loading ? "Securing Clinical Workspace..." : "Redirecting to clinical login..."}
          </p>
        </div>
      </div>
    );
  }

  // Prevent flash of login/auth screens if already logged in and redirecting to dashboard
  if (isLoggedIn && (pathname === "/login" || pathname === "/forgot-password" || pathname === "/")) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020306]">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent mx-auto" />
          <p className="text-sm font-mono text-white/50">Opening Clinical Workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}
