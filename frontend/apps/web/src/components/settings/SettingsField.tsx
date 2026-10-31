"use client";

import React from "react";
import { AlertCircle } from "lucide-react";

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
        <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
          {label}
          {required && (
            <span className="ml-1 text-red-500 font-bold" aria-hidden="true">
              *
            </span>
          )}
        </label>
        {badge && (
          <span className="text-[9px] font-bold bg-sky-50 text-sky-700 border border-sky-100 rounded px-1.5 py-0.5">
            {badge}
          </span>
        )}
      </div>

      {description && (
        <p className="text-[11px] leading-relaxed text-slate-400">{description}</p>
      )}

      <div className="relative pt-0.5">{children}</div>

      {error && (
        <p className="text-[11px] font-medium text-red-600 flex items-center gap-1">
          <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}
