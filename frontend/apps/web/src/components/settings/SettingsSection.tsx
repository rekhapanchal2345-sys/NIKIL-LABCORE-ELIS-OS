"use client";

import React from "react";

interface SettingsSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
}

export default function SettingsSection({
  title,
  description,
  children,
  actions,
  badge,
  icon,
}: SettingsSectionProps) {
  return (
    <section className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 dark:border-slate-800/80 dark:bg-slate-900/90 shadow-sm transition-all duration-300 hover:shadow-md">
      {/* Top Accent Highlight */}
      <div className="flex flex-col gap-3 border-b border-slate-100 dark:border-slate-800/80 px-6 py-5 sm:flex-row sm:items-center sm:justify-between bg-slate-50/50 dark:bg-slate-900/40">
        <div className="flex items-start gap-3.5">
          {icon && (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40">
              {icon}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {title}
              </h2>
              {badge && <div>{badge}</div>}
            </div>

            {description && (
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {description}
              </p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex items-center gap-2 pt-1 sm:pt-0">
            {actions}
          </div>
        )}
      </div>

      <div className="p-6">
        {children}
      </div>
    </section>
  );
}