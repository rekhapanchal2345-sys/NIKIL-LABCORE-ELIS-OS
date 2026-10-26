"use client";

import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Info,
  X,
  Volume2,
  ExternalLink,
  Siren,
} from "lucide-react";
import { audioAlertEngine } from "@/lib/audioAlerts";

export type ToastVariant = "success" | "error" | "warning" | "info" | "panic";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastItem {
  id: string;
  variant: ToastVariant;
  title?: string;
  message: string;
  duration?: number; // ms, default: 4000
  action?: ToastAction;
  timestamp: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, "id" | "timestamp">) => string;
  removeToast: (id: string) => void;
  success: (message: string, title?: string, action?: ToastAction) => string;
  error: (message: string, title?: string, action?: ToastAction) => string;
  warning: (message: string, title?: string, action?: ToastAction) => string;
  info: (message: string, title?: string, action?: ToastAction) => string;
  panic: (message: string, title?: string, action?: ToastAction) => string;
  clearAll: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (item: Omit<ToastItem, "id" | "timestamp">) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const duration = item.duration !== undefined ? item.duration : item.variant === "panic" ? 10000 : 4500;
      const newToast: ToastItem = {
        ...item,
        id,
        duration,
        timestamp: Date.now(),
      };

      // Play matching audio alert
      if (item.variant === "panic") {
        audioAlertEngine.playCriticalPanicChime().catch(() => {});
      } else if (item.variant === "warning" || item.variant === "error") {
        audioAlertEngine.playAbnormalWarningChime().catch(() => {});
      } else {
        audioAlertEngine.playInfoNotice().catch(() => {});
      }

      setToasts((prev) => [newToast, ...prev].slice(0, 5)); // Keep max 5 active toasts

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [removeToast]
  );

  const success = useCallback(
    (message: string, title?: string, action?: ToastAction) =>
      addToast({ variant: "success", message, title, action }),
    [addToast]
  );

  const error = useCallback(
    (message: string, title?: string, action?: ToastAction) =>
      addToast({ variant: "error", message, title, action }),
    [addToast]
  );

  const warning = useCallback(
    (message: string, title?: string, action?: ToastAction) =>
      addToast({ variant: "warning", message, title, action }),
    [addToast]
  );

  const info = useCallback(
    (message: string, title?: string, action?: ToastAction) =>
      addToast({ variant: "info", message, title, action }),
    [addToast]
  );

  const panic = useCallback(
    (message: string, title?: string, action?: ToastAction) =>
      addToast({ variant: "panic", message, title: title || "CRITICAL PANIC ALERT", action }),
    [addToast]
  );

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  const contextValue = useMemo(
    () => ({
      toasts,
      addToast,
      removeToast,
      success,
      error,
      warning,
      info,
      panic,
      clearAll,
    }),
    [toasts, addToast, removeToast, success, error, warning, info, panic, clearAll]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {/* Toast Render Desk */}
      <div
        aria-live="assertive"
        className="pointer-events-none fixed bottom-4 right-4 z-[9999] flex max-h-screen w-full max-w-sm flex-col gap-2.5 px-4 sm:px-0"
      >
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const getStyles = () => {
    switch (toast.variant) {
      case "panic":
        return {
          wrapper: "border-red-600/80 bg-red-950/90 text-white shadow-red-500/20 ring-2 ring-red-500 animate-pulse",
          icon: <Siren className="h-5 w-5 text-red-400 shrink-0 animate-bounce" />,
          titleColor: "text-red-200 font-bold",
        };
      case "error":
        return {
          wrapper: "border-rose-600/60 bg-slate-900/95 text-white shadow-rose-500/10 ring-1 ring-rose-500/40",
          icon: <AlertOctagon className="h-5 w-5 text-rose-400 shrink-0" />,
          titleColor: "text-rose-300 font-bold",
        };
      case "warning":
        return {
          wrapper: "border-amber-600/60 bg-slate-900/95 text-white shadow-amber-500/10 ring-1 ring-amber-500/40",
          icon: <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />,
          titleColor: "text-amber-300 font-bold",
        };
      case "info":
        return {
          wrapper: "border-blue-600/60 bg-slate-900/95 text-white shadow-blue-500/10 ring-1 ring-blue-500/40",
          icon: <Info className="h-5 w-5 text-blue-400 shrink-0" />,
          titleColor: "text-blue-300 font-bold",
        };
      case "success":
      default:
        return {
          wrapper: "border-emerald-600/60 bg-slate-900/95 text-white shadow-emerald-500/10 ring-1 ring-emerald-500/40",
          icon: <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />,
          titleColor: "text-emerald-300 font-bold",
        };
    }
  };

  const styles = getStyles();

  return (
    <div
      role="alert"
      className={`pointer-events-auto relative flex w-full items-start gap-3 rounded-xl border p-3.5 shadow-2xl backdrop-blur-xl transition-all duration-200 animate-in slide-in-from-right-4 fade-in ${styles.wrapper}`}
    >
      <div className="pt-0.5">{styles.icon}</div>

      <div className="min-w-0 flex-1">
        {toast.title && (
          <h4 className={`text-xs uppercase tracking-wider ${styles.titleColor}`}>
            {toast.title}
          </h4>
        )}
        <p className="text-xs font-medium text-slate-200 leading-relaxed mt-0.5">
          {toast.message}
        </p>

        {toast.action && (
          <button
            onClick={() => {
              toast.action?.onClick();
              onDismiss();
            }}
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-indigo-300 hover:text-white underline underline-offset-2 transition-colors"
          >
            <span>{toast.action.label}</span>
            <ExternalLink className="h-3 w-3" />
          </button>
        )}
      </div>

      <button
        onClick={onDismiss}
        className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
        title="Dismiss alert"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      toasts: [],
      addToast: () => "",
      removeToast: () => {},
      success: () => "",
      error: () => "",
      warning: () => "",
      info: () => "",
      panic: () => "",
      clearAll: () => {},
    };
  }
  return context;
}
