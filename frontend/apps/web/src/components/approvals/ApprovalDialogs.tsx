"use client";

import React, { useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, RotateCcw, X, XCircle } from "lucide-react";

export type DialogTone = "primary" | "danger" | "warning";

const TONE_STYLES: Record<
  DialogTone,
  { iconWrap: string; button: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  primary: {
    iconWrap: "bg-sky-50 text-[#0284C7] border-sky-100",
    button: "bg-[#0284C7] hover:bg-[#0369A1] focus-visible:ring-sky-300",
    Icon: CheckCircle2,
  },
  danger: {
    iconWrap: "bg-red-50 text-red-600 border-red-100",
    button: "bg-red-600 hover:bg-red-700 focus-visible:ring-red-300",
    Icon: XCircle,
  },
  warning: {
    iconWrap: "bg-amber-50 text-amber-600 border-amber-100",
    button: "bg-amber-600 hover:bg-amber-700 focus-visible:ring-amber-300",
    Icon: RotateCcw,
  },
};

function useEscape(open: boolean, onCancel: () => void, busy?: boolean) {
  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onCancel, busy]);
}

interface ShellProps {
  title: string;
  tone: DialogTone;
  busy?: boolean;
  onCancel: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
}

function DialogShell({ title, tone, busy, onCancel, children, footer }: ShellProps) {
  const { iconWrap, Icon } = TONE_STYLES[tone];
  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-slate-900/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-md overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className={`flex h-9 w-9 items-center justify-center rounded-lg border ${iconWrap}`}>
              <Icon className="h-4.5 w-4.5" />
            </span>
            <h2 className="text-sm font-bold text-slate-900">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            aria-label="Close"
            className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-40"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3">
          {footer}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Confirm dialog                                                      */
/* ------------------------------------------------------------------ */

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: DialogTone;
  busy?: boolean;
  /** Optional safety notice shown above the description (e.g. critical values selected). */
  notice?: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "primary",
  busy = false,
  notice,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEscape(open, onCancel, busy);
  if (!open) return null;

  return (
    <DialogShell
      title={title}
      tone={tone}
      busy={busy}
      onCancel={onCancel}
      footer={
        <>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:opacity-60 ${TONE_STYLES[tone].button}`}
          >
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {confirmLabel}
          </button>
        </>
      }
    >
      {notice && (
        <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
          <div>{notice}</div>
        </div>
      )}
      <div className="text-sm leading-relaxed text-slate-600">{description}</div>
    </DialogShell>
  );
}

/* ------------------------------------------------------------------ */
/* Reason dialog (reject / return for rerun)                           */
/* ------------------------------------------------------------------ */

interface ReasonDialogProps {
  open: boolean;
  title: string;
  description?: React.ReactNode;
  label?: string;
  placeholder?: string;
  confirmLabel?: string;
  tone?: DialogTone;
  minLength?: number;
  busy?: boolean;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

export function ReasonDialog({
  open,
  title,
  description,
  label = "Reason (recorded in the audit trail)",
  placeholder = "Describe the clinical or technical reason",
  confirmLabel = "Submit",
  tone = "danger",
  minLength = 5,
  busy = false,
  onConfirm,
  onCancel,
}: ReasonDialogProps) {
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setReason("");
      setTouched(false);
      const t = window.setTimeout(() => inputRef.current?.focus(), 30);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  useEscape(open, onCancel, busy);
  if (!open) return null;

  const trimmed = reason.trim();
  const valid = trimmed.length >= minLength;

  const submit = () => {
    setTouched(true);
    if (!valid || busy) return;
    onConfirm(trimmed);
  };

  return (
    <DialogShell
      title={title}
      tone={tone}
      busy={busy}
      onCancel={onCancel}
      footer={
        <>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={busy}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:opacity-60 ${TONE_STYLES[tone].button}`}
          >
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {confirmLabel}
          </button>
        </>
      }
    >
      {description && <div className="mb-3 text-sm leading-relaxed text-slate-600">{description}</div>}
      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</label>
      <textarea
        ref={inputRef}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        onBlur={() => setTouched(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) submit();
        }}
        rows={4}
        placeholder={placeholder}
        className={`w-full resize-none rounded-lg border bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none transition-colors focus:ring-2 ${
          touched && !valid
            ? "border-red-300 focus:border-red-400 focus:ring-red-100"
            : "border-slate-300 focus:border-sky-400 focus:ring-sky-100"
        }`}
      />
      <div className="mt-1 flex items-center justify-between text-[11px]">
        <span className={touched && !valid ? "text-red-600" : "text-slate-400"}>
          {touched && !valid ? `Please enter at least ${minLength} characters.` : "Ctrl + Enter to submit"}
        </span>
        <span className="text-slate-400">{trimmed.length} characters</span>
      </div>
    </DialogShell>
  );
}
