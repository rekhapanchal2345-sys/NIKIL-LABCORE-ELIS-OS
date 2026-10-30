"use client";

import React from "react";

interface SettingsFieldProps {
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  badge?: string;
}

export default function SettingsField({
  label,
  description,
  error,
  required = false,
  children,
  badge,
}: SettingsFieldProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold tracking-tight text-slate-700 dark:text-slate-300 uppercase">
          {label}
          {required && <span className="ml-1 text-rose-500 font-bold">*</span>}
        </label>
        {badge && (
          <span className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
            {badge}
          </span>
        )}
      </div>

      {description && (
        <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
          {description}
        </p>
      )}

      <div className="relative pt-0.5">{children}</div>

      {error && (
        <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  );
}