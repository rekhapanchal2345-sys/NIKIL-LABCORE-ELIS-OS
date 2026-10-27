"use client";

import React from "react";
import { usePathname } from "next/navigation";
import DashboardLayout from "@/components/layout/dashboardlayout";
import TestsNavigationHeader from "@/components/tests/TestsNavigationHeader";

export default function TestsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isStudioPage = pathname === "/tests/new" || pathname.startsWith("/tests/new/");

  return (
    <DashboardLayout title={isStudioPage ? "Diagnostic Investigation Studio" : "Diagnostic Investigation Catalogue"}>
      <div className="space-y-4">
        {!isStudioPage && <TestsNavigationHeader />}
        <div className="min-w-0">{children}</div>
      </div>
    </DashboardLayout>
  );
}
