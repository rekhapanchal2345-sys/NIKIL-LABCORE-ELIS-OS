"use client";
import React from "react";

export type SettingsTab =
  | "profile"
  | "general"
  | "laboratory"
  | "users"
  | "billing"
  | "notifications"
  | "security"
  | "integrations"
  | "advanced"
  | "data_retention"
  | "branding"
  | "backup";

const ALL_TABS: SettingsTab[] = [
  "profile",
  "general",
  "laboratory",
  "users",
  "billing",
  "notifications",
  "security",
  "integrations",
  "advanced",
  "data_retention",
  "branding",
  "backup",
];

export function isSettingsTab(val: any): val is SettingsTab {
  return typeof val === "string" && ALL_TABS.includes(val as SettingsTab);
}

export function SettingsTabs({ activeTab, onTabChange, tabs }: any) {
  const list: SettingsTab[] = Array.isArray(tabs) && tabs.length > 0 ? tabs : ALL_TABS;
  return (
    <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3 mb-6">
      {list.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onTabChange?.(tab)}
          className={`px-3.5 py-2 rounded-lg text-sm font-medium capitalize transition ${
            activeTab === tab
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          {tab.replace(/_/g, " ")}
        </button>
      ))}
    </div>
  );
}

export default SettingsTabs;
