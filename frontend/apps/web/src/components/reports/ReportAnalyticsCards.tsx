"use client";

import React, { useEffect, useState } from "react";
import { FileText, MessageCircle, Mail, Printer, Clock, AlertCircle } from "lucide-react";
import { reportsApi } from "@/lib/api";

interface ReportAnalyticsData {
  totalReportsGenerated: number;
  reportsGeneratedToday: number;
  reportsGeneratedThisMonth: number;
  whatsappDispatchCount: number;
  emailDispatchCount: number;
  hardCopyPrintedCount: number;
  pendingDispatchCount: number;
}

export default function ReportAnalyticsCards() {
  const [analytics, setAnalytics] = useState<ReportAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await reportsApi.getSummary();
        if (response.success && response.data) {
          setAnalytics(response.data);
        } else {
          setError(response.message || "Failed to load analytics");
        }
      } catch (err) {
        console.error("Error fetching report analytics:", err);
        setError("Failed to load analytics data");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="card bg-red-50 border-red-200">
        <div className="flex items-center gap-2 text-red-700">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm font-medium">Failed to load analytics data</p>
        </div>
      </div>
    );
  }

  const cards = [
    {
      title: "Total Reports Generated",
      value: analytics.totalReportsGenerated,
      subtitle: `${analytics.reportsGeneratedToday} today`,
      icon: FileText,
      color: "blue",
      trend: "+12%",
    },
    {
      title: "Digital Dispatch",
      value: analytics.whatsappDispatchCount + analytics.emailDispatchCount,
      subtitle: `WhatsApp: ${analytics.whatsappDispatchCount} | Email: ${analytics.emailDispatchCount}`,
      icon: MessageCircle,
      color: "green",
      trend: "+8%",
    },
    {
      title: "Hard Copies Printed",
      value: analytics.hardCopyPrintedCount,
      subtitle: "Physical reports at counter",
      icon: Printer,
      color: "amber",
      trend: "+5%",
    },
    {
      title: "Pending Dispatch",
      value: analytics.pendingDispatchCount,
      subtitle: "Awaiting delivery",
      icon: Clock,
      color: "red",
      trend: "-3%",
    },
  ];

  const colorClasses = {
    blue: {
      border: "border-l-cyan-500",
      iconBg: "border-cyan-500/30 bg-cyan-950/60 text-cyan-400",
    },
    green: {
      border: "border-l-emerald-500",
      iconBg: "border-emerald-500/30 bg-emerald-950/60 text-emerald-400",
    },
    amber: {
      border: "border-l-amber-500",
      iconBg: "border-amber-500/30 bg-amber-950/60 text-amber-400",
    },
    red: {
      border: "border-l-rose-500",
      iconBg: "border-rose-500/30 bg-rose-950/60 text-rose-400",
    },
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const colors = colorClasses[card.color as keyof typeof colorClasses];
        const Icon = card.icon;

        return (
          <div
            key={card.title}
            className={`relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-xl transition-all hover:bg-slate-900/60 border-l-4 ${colors.border}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {card.title}
                </p>
                <p className="mt-2 text-2xl font-black text-white font-mono">
                  {card.value}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {card.subtitle}
                </p>
              </div>
              <div className={`p-2.5 rounded-xl border shadow-sm ${colors.iconBg}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 border-t border-slate-800/80 pt-2.5">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                card.trend.startsWith("+")
                  ? "border border-emerald-500/30 bg-emerald-950/60 text-emerald-300"
                  : "border border-rose-500/30 bg-rose-950/60 text-rose-300"
              }`}>
                {card.trend}
              </span>
              <span className="text-[11px] text-slate-400">vs last period</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}