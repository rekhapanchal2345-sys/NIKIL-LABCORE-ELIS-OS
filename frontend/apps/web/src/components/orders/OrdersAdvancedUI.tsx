"use client";

import React from "react";

export interface OrderAnalytics {
  overview?: any;
  revenue?: any;
  [key: string]: any;
}

export interface TATData {
  [key: string]: any;
}

export interface PipelineData {
  [key: string]: any;
}

export function OrderAnalyticsDashboard({ analytics }: { analytics?: OrderAnalytics }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs text-xs text-slate-700">
      Total Orders: {analytics?.overview?.totalOrders || 0}
    </div>
  );
}

export function OrderPipelineView(_props: any) {
  return null;
}

export function TATMonitorPanel({ isOpen, onClose }: { tatData?: any; isOpen?: boolean; onClose?: () => void; onOrderClick?: (id: string) => void }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="rounded-2xl bg-white p-5 shadow-xl">
        <button type="button" onClick={onClose} className="text-xs font-bold">Close</button>
      </div>
    </div>
  );
}

export function AdvancedFilterBar(_props: any) {
  return null;
}
