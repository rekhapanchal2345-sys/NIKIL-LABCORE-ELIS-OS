"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "./useAuth";
import { getUserRole } from "../lib/auth";
import { isRoleAllowed, normalizeRole } from "../lib/rbac";

export function useRoleGuard(
  allowedRoles?: string[],
  options: { redirectOnDenied?: boolean; redirectUrl?: string } = {}
) {
  const { redirectOnDenied = true, redirectUrl = "/unauthorized" } = options;
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();

  const currentRole = user ? getUserRole(user) : null;
  const isAuthorized = isRoleAllowed(currentRole, allowedRoles);

  useEffect(() => {
    if (!loading && user && !isAuthorized && redirectOnDenied) {
      router.push(
        `${redirectUrl}?from=${encodeURIComponent(pathname)}&role=${encodeURIComponent(
          currentRole || ""
        )}`
      );
    }
  }, [loading, user, isAuthorized, redirectOnDenied, redirectUrl, pathname, router, currentRole]);

  return {
    isAuthorized,
    role: currentRole,
    normalizedRole: normalizeRole(currentRole),
    loading,
    user,
  };
}

export default useRoleGuard;
