"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/layout/dashboardlayout";
import {
  FlaskConical,
  PlusCircle,
  FolderTree,
  Sliders,
  Scale,
  Package,
  ShieldCheck,
  ClipboardList,
  TestTube2,
  Settings2,
  Calculator,
  TrendingUp,
} from "lucide-react";

export default function TestsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const navItems = [
    { href: "/tests", label: "Catalogue", icon: FlaskConical, exact: true },
    { href: "/tests/new", label: "New investigation", icon: PlusCircle },
    { href: "/tests/categories", label: "Departments", icon: FolderTree },
    { href: "/tests/packages", label: "Packages & profiles", icon: Package },
    { href: "/tests/parameters", label: "Analytes & units", icon: Sliders },
    { href: "/tests/reference-ranges", label: "Reference intervals", icon: Scale },
  ];

  const workspaceItems = [
    { href: "/tests?workspace=qc", label: "Quality & instruments", icon: ShieldCheck },
    { href: "/tests?workspace=interfacing", label: "Analyzer connections", icon: Settings2 },
    { href: "/tests?workspace=formulas", label: "Calculated results", icon: Calculator },
    { href: "/tests?workspace=b2b-tariff", label: "Tariffs", icon: TrendingUp },
    { href: "/tests?workspace=panic-alerts", label: "Critical values", icon: ShieldCheck },
    { href: "/tests?workspace=phlebotomy-sop", label: "Specimen collection", icon: TestTube2 },
  ];

  const handoffItems = [
    { href: "/orders/new", label: "Order entry", icon: ClipboardList },
    { href: "/samples/tube-accessioning", label: "Specimen accession", icon: TestTube2 },
  ];

  const isMainCatalogue = pathname === "/tests" || pathname.startsWith("/tests/");

  return (
    <DashboardLayout title="Diagnostic test catalogue">
      <div className="space-y-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          <div className="flex flex-col gap-2 px-2 py-1">
            <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
              <nav aria-label="Test master data" className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                {navItems.map((item) => {
                  const isActive = item.href === "/tests"
                    ? isMainCatalogue && !["/tests/new", "/tests/categories", "/tests/packages", "/tests/parameters", "/tests/reference-ranges"].some((route) => pathname === route || pathname.startsWith(route + "/"))
                    : pathname === item.href || pathname.startsWith(item.href + "/");
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
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

            <div className="flex flex-col gap-2 border-t border-slate-100 pt-2 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-center gap-2 overflow-x-auto">
                <span className="shrink-0 px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Clinical controls</span>
                <nav aria-label="Clinical test controls" className="flex items-center gap-1">
                  {workspaceItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === "/tests" && searchParams.get("workspace") === item.href.split("=")[1];
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-current={isActive ? "page" : undefined}
                        className={`inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${isActive ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                      >
                        <Icon className="h-3.5 w-3.5 text-slate-500" />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <nav aria-label="Clinical workflow handoffs" className="flex items-center gap-1 border-l border-slate-200 pl-2">
                {handoffItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.href} href={item.href} className="inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-sky-700 transition-colors hover:bg-sky-50">
                      <Icon className="h-3.5 w-3.5" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
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
