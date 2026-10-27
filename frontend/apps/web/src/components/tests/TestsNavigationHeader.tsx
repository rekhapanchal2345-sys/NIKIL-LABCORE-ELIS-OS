"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { testApi } from "@/lib/api";
import {
  Calculator,
  ChevronRight,
  CircleAlert,
  ClipboardList,
  FlaskConical,
  FolderTree,
  Package,
  Plus,
  Scale,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  TestTube2,
  TrendingUp,
} from "lucide-react";

interface TestsNavigationHeaderProps {
  stats?: {
    totalTests?: number;
    activeCount?: number;
    departmentsCount?: number;
    packagesCount?: number;
  };
}

const navigationItems = [
  { href: "/tests", label: "Catalogue", description: "Orderable investigations", icon: FlaskConical, exact: true },
  { href: "/tests/packages", label: "Packages & profiles", description: "Configured test groups", icon: Package },
  { href: "/tests/parameters", label: "Analytes & units", description: "Result definitions", icon: SlidersHorizontal },
  { href: "/tests/reference-ranges", label: "Reference intervals", description: "Age and sex ranges", icon: Scale },
  { href: "/tests/categories", label: "Departments", description: "Clinical taxonomy", icon: FolderTree },
  { href: "/tests?workspace=panic-alerts", label: "Critical values", description: "Panic thresholds", icon: CircleAlert, workspace: "panic-alerts" },
  { href: "/tests?workspace=phlebotomy-sop", label: "Specimen SOP", description: "Collection requirements", icon: TestTube2, workspace: "phlebotomy-sop" },
  { href: "/tests?workspace=interfacing", label: "Analyzer mapping", description: "Instrument codes", icon: Settings2, workspace: "interfacing" },
  { href: "/tests?workspace=qc", label: "Quality controls", description: "QC configuration", icon: ShieldCheck, workspace: "qc" },
  { href: "/tests?workspace=formulas", label: "Derived calculations", description: "Formula definitions", icon: Calculator, workspace: "formulas" },
  { href: "/tests?workspace=b2b-tariff", label: "Rate cards", description: "Commercial schedules", icon: TrendingUp, workspace: "b2b-tariff" },
];

export default function TestsNavigationHeader({ stats }: TestsNavigationHeaderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const workspace = searchParams.get("workspace");
  const [catalogStats, setCatalogStats] = useState<TestsNavigationHeaderProps["stats"]>(stats);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      testApi.getAll("page=1&limit=1"),
      testApi.getAll("page=1&limit=1&isActive=true"),
      testApi.getCategories(),
    ])
      .then(([allTests, activeTests, categories]: any[]) => {
        if (cancelled) return;
        setCatalogStats({
          totalTests: stats?.totalTests ?? allTests?.data?.pagination?.total,
          activeCount: stats?.activeCount ?? activeTests?.data?.pagination?.total,
          departmentsCount: stats?.departmentsCount ?? (Array.isArray(categories?.data) ? categories.data.length : undefined),
          packagesCount: stats?.packagesCount,
        });
      })
      .catch(() => {
        if (!cancelled) setCatalogStats(stats);
      });
    return () => {
      cancelled = true;
    };
  }, [stats]);

  const isActive = (item: (typeof navigationItems)[number]) => {
    if (item.workspace) return workspace === item.workspace;
    if (item.exact) return pathname === item.href && !workspace;
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  };

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs sm:p-6">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <Link href="/" className="hover:text-slate-900">Clinical operations</Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <Link href="/orders" className="hover:text-slate-900">Orders &amp; laboratory</Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="font-semibold text-slate-800">Investigation catalogue</span>
            </div>
            <div className="mt-4 flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-sky-100 bg-sky-50 text-sky-700">
                <FlaskConical className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-sky-700">Laboratory master data</p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Diagnostic investigation directory</h1>
                <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-600">
                  Maintain the orderable test definition used by requisitions, specimen collection, result entry, reporting and billing.
                </p>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Link href="/orders" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
              <ClipboardList className="h-3.5 w-3.5 text-sky-700" /> Orders
            </Link>
            <Link href="/tests/new" className="inline-flex items-center gap-1.5 rounded-lg bg-sky-700 px-3.5 py-2 text-xs font-bold text-white shadow-2xs hover:bg-sky-800">
              <Plus className="h-3.5 w-3.5" /> New investigation
            </Link>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4 sm:grid-cols-4">
          {[
            ["Catalogue entries", catalogStats?.totalTests],
            ["Active / orderable", catalogStats?.activeCount],
            ["Departments", catalogStats?.departmentsCount],
            ["Packages", catalogStats?.packagesCount],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
              <p className="mt-1 text-lg font-black text-slate-900">{value ?? "—"}</p>
            </div>
          ))}
        </div>
      </div>

      <nav aria-label="Investigation catalogue navigation" className="rounded-2xl border border-slate-200 bg-white p-2 shadow-2xs">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-w-[145px] shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-left transition ${
                  active
                    ? "border-sky-200 bg-sky-50 text-sky-900"
                    : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${active ? "text-sky-700" : "text-slate-500"}`} />
                <span className="min-w-0">
                  <span className="block truncate text-xs font-bold">{item.label}</span>
                  <span className="block truncate text-[10px] text-slate-500">{item.description}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </section>
  );
}
