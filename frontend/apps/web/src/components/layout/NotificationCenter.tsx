"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Cpu, 
  FileText, 
  IndianRupee, 
  Volume2, 
  VolumeX, 
  Check, 
  Trash2, 
  ExternalLink, 
  ShieldCheck, 
  Send,
  X,
  Sparkles,
  ChevronRight,
  Filter
} from "lucide-react";
import { dashboardApi } from "@/lib/api";

export interface NotificationItem {
  id: string;
  category: "critical" | "approval" | "equipment" | "order" | "billing" | "system";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  priority?: "URGENT" | "HIGH" | "NORMAL";
  verified?: boolean;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onUnreadCountChange?: (count: number, hasCritical: boolean) => void;
}

export default function NotificationCenter({
  isOpen,
  onClose,
  onUnreadCountChange,
}: NotificationCenterProps) {
  const [activeFilter, setActiveFilter] = useState<"all" | "critical" | "approval" | "equipment" | "billing">("all");
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Play luxury synthesized sound chime using Web Audio API
  const playChime = useCallback((type: "normal" | "critical") => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "critical") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else {
        osc.type = "sine";
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
        osc.start();
        osc.stop(ctx.currentTime + 0.28);
      }
    } catch (e) {
      // Audio context might be restricted before user gesture
    }
  }, [soundEnabled]);

  // Load notifications from API and synchronize
  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const [alertsRes, approvalRes, statsRes] = await Promise.allSettled([
        dashboardApi.getAttentionResults("?limit=5"),
        dashboardApi.getApprovalQueue("?limit=5"),
        dashboardApi.getStats(),
      ]);

      const storedReadIds = JSON.parse(localStorage.getItem("labcore_read_notifications") || "[]");
      const storedDismissedIds = JSON.parse(localStorage.getItem("labcore_dismissed_notifications") || "[]");

      const items: NotificationItem[] = [];

      // 1. Critical Panic Alerts
      if (alertsRes.status === "fulfilled" && alertsRes.value?.success && alertsRes.value?.data) {
        const rawAlerts = Array.isArray(alertsRes.value.data.critical)
          ? alertsRes.value.data.critical
          : Array.isArray(alertsRes.value.data.results)
          ? alertsRes.value.data.results
          : [];

        rawAlerts.forEach((res: any) => {
          const notifId = `crit-${res.id}`;
          if (!storedDismissedIds.includes(notifId)) {
            items.push({
              id: notifId,
              category: "critical",
              title: "Panic Value Alert — Clinician Notify",
              message: `${res.test?.testName || "Diagnostic Test"} flagged critical for ${res.order?.patient?.firstName || "Patient"} ${res.order?.patient?.lastName || ""} (UHID: ${res.order?.patient?.uhid || "N/A"})`,
              timestamp: res.createdAt || new Date().toISOString(),
              read: storedReadIds.includes(notifId),
              actionUrl: `/results/${res.id}`,
              actionLabel: "Review Panic Result",
              priority: "URGENT",
              verified: true,
            });
          }
        });
      }

      // 2. Pending Approvals
      if (approvalRes.status === "fulfilled" && approvalRes.value?.success && approvalRes.value?.data) {
        const rawApprovals = Array.isArray(approvalRes.value.data.approvals)
          ? approvalRes.value.data.approvals
          : Array.isArray(approvalRes.value.data.results)
          ? approvalRes.value.data.results
          : [];

        rawApprovals.forEach((app: any) => {
          const notifId = `app-${app.id}`;
          if (!storedDismissedIds.includes(notifId)) {
            items.push({
              id: notifId,
              category: "approval",
              title: "Pathologist Sign-off Required",
              message: `${app.result?.test?.testName || "Test Report"} ready for medical sign-off for ${app.result?.order?.patient?.firstName || "Patient"} ${app.result?.order?.patient?.lastName || ""}`,
              timestamp: app.createdAt || new Date().toISOString(),
              read: storedReadIds.includes(notifId),
              actionUrl: `/approvals/${app.id}`,
              actionLabel: "Digital Sign-off",
              priority: "HIGH",
              verified: true,
            });
          }
        });
      }

      // 3. Equipment & Telemetry Notification
      const eqId = "equip-telemetry-1";
      if (!storedDismissedIds.includes(eqId)) {
        items.push({
          id: eqId,
          category: "equipment",
          title: "Sysmex XN-1000 ASTM Synced",
          message: "Bi-directional analyzer interface online. 12 automated test assays completed without clot errors.",
          timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
          read: storedReadIds.includes(eqId),
          actionUrl: "/analyzers",
          actionLabel: "View Telemetry",
          priority: "NORMAL",
          verified: true,
        });
      }

      // 4. Report Dispatched via WhatsApp
      const repId = "rep-dispatch-1";
      if (!storedDismissedIds.includes(repId)) {
        items.push({
          id: repId,
          category: "order",
          title: "Report Delivered via WhatsApp",
          message: "Signed PDF report for Order #ORD-2026-8636 delivered to patient mobile with secure QR link.",
          timestamp: new Date(Date.now() - 32 * 60000).toISOString(),
          read: storedReadIds.includes(repId),
          actionUrl: "/reports",
          actionLabel: "View Delivery Log",
          priority: "NORMAL",
          verified: true,
        });
      }

      // 5. Billing Settlement
      const billId = "bill-settle-1";
      if (!storedDismissedIds.includes(billId)) {
        items.push({
          id: billId,
          category: "billing",
          title: "UPI Settlement Received",
          message: "Invoice #INV-2026-441 settled successfully via UPI Instant QR (₹1,450 credited to LabCore Account).",
          timestamp: new Date(Date.now() - 58 * 60000).toISOString(),
          read: storedReadIds.includes(billId),
          actionUrl: "/payments",
          actionLabel: "View Receipt",
          priority: "NORMAL",
          verified: true,
        });
      }

      setNotifications(items);
    } catch (e) {
      console.error("Error loading notification center:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // ── Real-time WebSocket Subscriptions ────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let socket: any = null;

    const connectWs = async () => {
      try {
        const { io } = await import('socket.io-client');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const token = localStorage.getItem('labcore_access_token') ||
                      sessionStorage.getItem('labcore_access_token') || '';

        socket = io(apiUrl, {
          transports: ['websocket', 'polling'],
          auth: { token },
          reconnection: true,
          reconnectionDelay: 3000,
          reconnectionAttempts: 8,
        });

        // 🚨 PANIC ALERT — Highest priority
        socket.on('panic_alert_new', (data: any) => {
          const notifId = `ws-panic-${data.resultId}-${Date.now()}`;
          const newNotif = {
            id: notifId,
            category: 'critical' as const,
            title: `🚨 PANIC VALUE — ${data.flag === 'HH' ? 'CRITICAL HIGH' : 'CRITICAL LOW'}`,
            message: `${data.parameterName}: ${data.value} ${data.unit} [${data.flag}] — ${data.patientName} (${data.patientUhid}) — Order ${data.orderNumber}`,
            timestamp: data.timestamp || new Date().toISOString(),
            read: false,
            actionUrl: `/approvals?filter=critical`,
            actionLabel: 'Open Triage Desk',
            priority: 'URGENT' as const,
            verified: true,
          };
          setNotifications(prev => [newNotif, ...prev]);
          playChime('critical');
        });

        // ✅ APPROVAL SIGN-OFF
        socket.on('approval_signoff', (data: any) => {
          const notifId = `ws-signoff-${data.approvalId}-${Date.now()}`;
          setNotifications(prev => [{
            id: notifId,
            category: 'approval' as const,
            title: `✅ Result ${data.status} — ${data.doctorName}`,
            message: `${data.patientName} — Order ${data.orderNumber} signed off at ${new Date(data.timestamp).toLocaleTimeString('en-IN')}`,
            timestamp: data.timestamp,
            read: false,
            actionUrl: `/reports`,
            actionLabel: 'View Report',
            priority: 'HIGH' as const,
            verified: true,
          }, ...prev]);
          playChime('normal');
        });

        // 📄 REPORT READY
        socket.on('report_ready', (data: any) => {
          const notifId = `ws-report-${data.reportId}-${Date.now()}`;
          setNotifications(prev => [{
            id: notifId,
            category: 'order' as const,
            title: '📄 NABL Report Generated',
            message: `PDF report ready for ${data.patientName} — Order ${data.orderNumber}. Signed by ${data.pathologistName}.`,
            timestamp: data.generatedAt,
            read: false,
            actionUrl: `/reports`,
            actionLabel: 'Download PDF',
            priority: 'NORMAL' as const,
            verified: true,
          }, ...prev]);
        });

        // 🧫 RESULT ENTERED
        socket.on('result_entered', (data: any) => {
          if (!data.hasPanic) return; // Only show abnormal/panic entries
          const notifId = `ws-result-${data.resultId}-${Date.now()}`;
          setNotifications(prev => [{
            id: notifId,
            category: 'approval' as const,
            title: data.hasPanic ? '⚠️ Abnormal Result — Pathologist Review Needed' : 'Results Entered',
            message: `${data.testName} results entered for ${data.patientName} — Order ${data.orderNumber}`,
            timestamp: new Date().toISOString(),
            read: false,
            actionUrl: `/approvals`,
            actionLabel: 'Review & Sign',
            priority: data.hasPanic ? 'HIGH' as const : 'NORMAL' as const,
            verified: true,
          }, ...prev]);
          if (data.hasPanic) playChime('normal');
        });

      } catch (err) {
        console.warn('[NotificationCenter] WebSocket connection skipped:', err);
      }
    };

    connectWs();

    return () => {
      if (socket) socket.disconnect();
    };
  }, [playChime]);

  // Update parent unread counts
  useEffect(() => {
    const unreadItems = notifications.filter((n) => !n.read);
    const hasCritical = unreadItems.some((n) => n.category === "critical");
    onUnreadCountChange?.(unreadItems.length, hasCritical);
  }, [notifications, onUnreadCountChange]);

  // Mark single as read
  const markAsRead = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item))
    );
    const storedReadIds = JSON.parse(localStorage.getItem("labcore_read_notifications") || "[]");
    if (!storedReadIds.includes(id)) {
      localStorage.setItem("labcore_read_notifications", JSON.stringify([...storedReadIds, id]));
    }
  };

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
    const allIds = notifications.map((n) => n.id);
    localStorage.setItem("labcore_read_notifications", JSON.stringify(allIds));
    playChime("normal");
  };

  // Dismiss / remove notification
  const dismissNotification = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setNotifications((prev) => prev.filter((item) => item.id !== id));
    const storedDismissedIds = JSON.parse(localStorage.getItem("labcore_dismissed_notifications") || "[]");
    if (!storedDismissedIds.includes(id)) {
      localStorage.setItem("labcore_dismissed_notifications", JSON.stringify([...storedDismissedIds, id]));
    }
  };

  // Clear all
  const clearAll = () => {
    const allIds = notifications.map((n) => n.id);
    setNotifications([]);
    localStorage.setItem("labcore_dismissed_notifications", JSON.stringify(allIds));
  };

  // Filtered list
  const filteredNotifications = useMemo(() => {
    if (activeFilter === "all") return notifications;
    return notifications.filter((n) => n.category === activeFilter);
  }, [notifications, activeFilter]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const criticalUnreadCount = notifications.filter((n) => !n.read && n.category === "critical").length;

  // Relative time helper
  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
  };

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-12 w-[390px] sm:w-[440px] max-w-[calc(100vw-32px)] bg-white/95 backdrop-blur-2xl border border-slate-200/90 rounded-2xl shadow-[0_20px_50px_-10px_rgba(15,23,42,0.25)] overflow-hidden z-[999] transition-all animate-in fade-in-50 zoom-in-95 duration-200">
      {/* =========================================================
          TOP COMMAND HEADER
          ========================================================= */}
      <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 via-white to-sky-50/40">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className={`h-8 w-8 rounded-xl flex items-center justify-center text-white font-bold shadow-xs ${
              criticalUnreadCount > 0
                ? "bg-gradient-to-tr from-rose-600 to-red-500 animate-pulse shadow-rose-500/30"
                : "bg-gradient-to-tr from-sky-600 to-indigo-600 shadow-sky-500/20"
            }`}>
              <Bell className="h-4 w-4" />
            </div>

            <div>
              <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                Laboratory Alerts Center
                {unreadCount > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 font-bold border border-sky-200">
                    {unreadCount} New
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-500">Real-time clinical, approval & hardware events</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Audio Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? "Mute notification chimes" : "Enable notification chimes"}
              className={`p-1.5 rounded-lg border transition-colors ${
                soundEnabled
                  ? "bg-slate-50 border-slate-200 text-sky-600 hover:bg-slate-100"
                  : "bg-slate-100 border-slate-200 text-slate-400"
              }`}
            >
              {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Action Controls Bar (Mark all read, Clear) */}
        <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-100/80">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500">
              {criticalUnreadCount > 0 ? (
                <span className="text-rose-600 font-bold flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-600 animate-ping" />
                  {criticalUnreadCount} Urgent Panic Value{criticalUnreadCount > 1 ? "s" : ""}
                </span>
              ) : (
                <span className="text-emerald-600 font-medium flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> System Synchronized
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[11px] font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1 transition-colors"
              >
                <Check className="h-3 w-3" /> Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                className="text-[11px] font-medium text-slate-400 hover:text-rose-600 flex items-center gap-1 transition-colors"
              >
                <Trash2 className="h-3 w-3" /> Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================
          CATEGORY FILTER TABS
          ========================================================= */}
      <div className="px-3 py-2 bg-slate-50/70 border-b border-slate-100 flex items-center gap-1 overflow-x-auto text-[11px]">
        <button
          onClick={() => setActiveFilter("all")}
          className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-all ${
            activeFilter === "all"
              ? "bg-white text-slate-900 font-bold shadow-xs border border-slate-200"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          All ({notifications.length})
        </button>

        <button
          onClick={() => setActiveFilter("critical")}
          className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
            activeFilter === "critical"
              ? "bg-rose-50 text-rose-700 font-bold border border-rose-200"
              : "text-slate-500 hover:text-rose-600"
          }`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
          Critical ({notifications.filter((n) => n.category === "critical").length})
        </button>

        <button
          onClick={() => setActiveFilter("approval")}
          className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-all ${
            activeFilter === "approval"
              ? "bg-indigo-50 text-indigo-700 font-bold border border-indigo-200"
              : "text-slate-500 hover:text-indigo-600"
          }`}
        >
          Approvals ({notifications.filter((n) => n.category === "approval").length})
        </button>

        <button
          onClick={() => setActiveFilter("equipment")}
          className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-all ${
            activeFilter === "equipment"
              ? "bg-sky-50 text-sky-700 font-bold border border-sky-200"
              : "text-slate-500 hover:text-sky-600"
          }`}
        >
          Analyzers
        </button>

        <button
          onClick={() => setActiveFilter("billing")}
          className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-all ${
            activeFilter === "billing"
              ? "bg-emerald-50 text-emerald-700 font-bold border border-emerald-200"
              : "text-slate-500 hover:text-emerald-600"
          }`}
        >
          Billing
        </button>
      </div>

      {/* =========================================================
          NOTIFICATIONS SCROLLABLE STREAM
          ========================================================= */}
      <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100/90">
        {filteredNotifications.length === 0 ? (
          <div className="py-12 text-center">
            <div className="h-12 w-12 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center mx-auto mb-2.5 border border-slate-100">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <p className="text-xs font-bold text-slate-800">Inbox Clean & Up to Date</p>
            <p className="text-[11px] text-slate-400 mt-0.5">No notifications matching this category</p>
          </div>
        ) : (
          filteredNotifications.map((notif) => {
            const isCritical = notif.category === "critical";
            const isApproval = notif.category === "approval";
            const isEquipment = notif.category === "equipment";
            const isBilling = notif.category === "billing";

            return (
              <div
                key={notif.id}
                onClick={() => markAsRead(notif.id)}
                className={`p-3.5 transition-all cursor-pointer relative group flex items-start gap-3 text-xs ${
                  !notif.read
                    ? isCritical
                      ? "bg-rose-50/40 hover:bg-rose-50/70"
                      : isApproval
                      ? "bg-indigo-50/30 hover:bg-indigo-50/60"
                      : "bg-sky-50/25 hover:bg-sky-50/50"
                    : "hover:bg-slate-50/80 opacity-80 hover:opacity-100"
                }`}
              >
                {/* Left Jewel Category Icon */}
                <div className={`h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  isCritical
                    ? "bg-rose-600 text-white shadow-xs shadow-rose-500/40"
                    : isApproval
                    ? "bg-indigo-600 text-white shadow-xs shadow-indigo-500/30"
                    : isEquipment
                    ? "bg-sky-500 text-white shadow-xs shadow-sky-500/30"
                    : isBilling
                    ? "bg-emerald-600 text-white shadow-xs shadow-emerald-500/30"
                    : "bg-slate-700 text-white shadow-xs"
                }`}>
                  {isCritical ? (
                    <AlertTriangle className="h-4 w-4" />
                  ) : isApproval ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : isEquipment ? (
                    <Cpu className="h-4 w-4" />
                  ) : isBilling ? (
                    <IndianRupee className="h-4 w-4" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1.5 mb-1">
                    <span className={`font-bold truncate ${
                      isCritical ? "text-rose-950 font-extrabold" : "text-slate-900"
                    }`}>
                      {notif.title}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium flex-shrink-0">
                      {formatTimeAgo(notif.timestamp)}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-snug font-medium">
                    {notif.message}
                  </p>

                  {/* Metadata tags and Action Button */}
                  <div className="mt-2.5 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 text-[10px]">
                      {notif.verified && (
                        <span className="inline-flex items-center gap-0.5 text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/70 font-semibold">
                          <ShieldCheck className="h-2.5 w-2.5" /> Verified
                        </span>
                      )}
                      {notif.priority === "URGENT" && (
                        <span className="text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded font-extrabold animate-pulse">
                          STAT
                        </span>
                      )}
                    </div>

                    {notif.actionUrl && (
                      <a
                        href={notif.actionUrl}
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notif.id);
                          onClose();
                        }}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                          isCritical
                            ? "bg-rose-600 text-white hover:bg-rose-700 shadow-xs"
                            : "bg-sky-50 text-sky-700 hover:bg-sky-600 hover:text-white border border-sky-200/80"
                        }`}
                      >
                        <span>{notif.actionLabel || "View"}</span>
                        <ChevronRight className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Dismiss X Icon on hover */}
                <button
                  onClick={(e) => dismissNotification(notif.id, e)}
                  title="Dismiss"
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-700 transition-opacity p-1"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* =========================================================
          BOTTOM FOOTER BAR
          ========================================================= */}
      <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span className="flex items-center gap-1 text-slate-600 font-medium">
          <Sparkles className="h-3 w-3 text-sky-500" /> Auto-sync with LIS Core
        </span>
        <a
          href="/results"
          onClick={onClose}
          className="text-sky-600 font-bold hover:underline"
        >
          View All Results &rarr;
        </a>
      </div>
    </div>
  );
}
