"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getUserRole } from "@/lib/auth";
import { isRoleAllowed, normalizeRole, getRoleBadgeLabel } from "@/lib/rbac";
import { ShieldAlert, Loader2 } from "lucide-react";

export interface RouteGuardProps {
  allowedRoles?: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RouteGuard({
  allowedRoles,
  children,
  fallback,
}: RouteGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentRole = user ? getUserRole(user) : null;
  const authorized = isRoleAllowed(currentRole, allowedRoles);

  useEffect(() => {
    if (!loading && mounted) {
      if (!user) {
        // Not authenticated
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      } else if (!authorized) {
        // Authenticated but unauthorized
        router.push(
          `/unauthorized?from=${encodeURIComponent(pathname)}&role=${encodeURIComponent(
            currentRole || ""
          )}`
        );
      }
    }
  }, [user, loading, authorized, mounted, pathname, router, currentRole]);

  if (loading || !mounted) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#0284C7]" />
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
          Verifying Clinical Permissions...
        </p>
      </div>
    );
  }

  if (!user || !authorized) {
    if (fallback) return <>{fallback}</>;

    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 shadow-inner">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
        <p className="mt-2 max-w-md text-sm text-slate-600">
          Your current account role (
          <span className="font-semibold text-rose-600">
            {getRoleBadgeLabel(currentRole)}
          </span>
          ) does not hold authorization to access this clinical module.
        </p>
        <button
          onClick={() => router.push("/dashboard")}
          className="mt-6 rounded-lg bg-[#0284C7] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#0369A1] transition-all"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return <>{children}</>;
}

export default RouteGuard;
