"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import DashboardLayout from "@/components/layout/dashboardlayout";
import {
  FlaskConical,
  PlusCircle,
  FolderTree,
  Sliders,
  Scale,
  Package,
  ShieldCheck,
  GraduationCap,
} from "lucide-react";

export default function TestsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { href: "/tests", label: "Test catalogue", icon: FlaskConical, exact: true },
    { href: "/tests/new", label: "New investigation", icon: PlusCircle },
    { href: "/tests/categories", label: "Departments", icon: FolderTree },
    { href: "/tests/packages", label: "Packages & profiles", icon: Package },
    { href: "/tests/parameters", label: "Analytes & units", icon: Sliders },
    { href: "/tests/reference-ranges", label: "Reference intervals", icon: Scale },
    { href: "/tests/training", label: "Staff training", icon: GraduationCap },
  ];

  return (
    <DashboardLayout title="Diagnostic test catalogue">
      <div className="space-y-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          <div className="flex flex-col gap-3 px-2 py-1 lg:flex-row lg:items-center lg:justify-between">
            {/* Navigation Tabs */}
            <nav aria-label="Test catalogue sections" className="flex items-center gap-1.5 overflow-x-auto py-0.5">
              {navItems.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex min-h-9 items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold transition-colors duration-200 ${
                      isActive
                        ? "border border-sky-200 bg-sky-50 text-sky-800"
                        : "border border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${isActive ? "text-sky-700" : "text-slate-500"}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="hidden items-center gap-2 border-l border-slate-200 pl-4 pr-2 text-xs text-slate-500 xl:flex">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600">
                <ShieldCheck className="h-3.5 w-3.5" />
              </span>
              <span className="font-medium">Controlled clinical master data</span>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="min-w-0">
          {children}
        </div>
      </div>
    </DashboardLayout>
  );
}
