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
    <section className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_3px_0_rgb(0,0,0,0.05)] hover:shadow-[0_2px_8px_0_rgb(0,0,0,0.08)] transition-shadow duration-200">
      {/* Section Header */}
      <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3.5">
          {icon && (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 border border-sky-100 text-sky-700">
              {icon}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-sm font-semibold tracking-tight text-slate-800">
                {title}
              </h2>
              {badge && <div>{badge}</div>}
            </div>

            {description && (
              <p className="mt-0.5 text-[11px] text-slate-500">{description}</p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex items-center gap-2 pt-1 sm:pt-0">
            {actions}
          </div>
        )}
      </div>

      {/* Section Content */}
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}
