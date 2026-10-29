/**
 * Shared helpers for the Pathologist Approvals module.
 *
 * Everything here is derived from real result data (timestamps and flags coming
 * from the API). Nothing is estimated or simulated.
 */

/**
 * Waiting-time thresholds used only to colour the "Waiting" column.
 * They are display hints, not clinical policy - adjust them to match the
 * laboratory's own turnaround-time (TAT) targets.
 */
export const WAITING_THRESHOLDS_MINUTES = {
  routine: { warn: 4 * 60, breach: 8 * 60 },
  critical: { warn: 30, breach: 60 },
} as const;

export type WaitingTone = "ok" | "warn" | "breach" | "unknown";

/** Whole minutes elapsed since an ISO timestamp, or null when it cannot be read. */
export function minutesSince(iso?: string | null, now: number = Date.now()): number | null {
  if (!iso) return null;
  const parsed = new Date(iso).getTime();
  if (Number.isNaN(parsed)) return null;
  return Math.max(0, Math.floor((now - parsed) / 60000));
}

/** Compact duration such as "35 min", "3 h 20 m" or "2 d 4 h". */
export function formatWaiting(minutes: number | null): string {
  if (minutes === null) return "—";
  if (minutes < 1) return "< 1 min";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours < 24) return mins > 0 ? `${hours} h ${mins} m` : `${hours} h`;
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return remHours > 0 ? `${days} d ${remHours} h` : `${days} d`;
}

export function getWaitingTone(minutes: number | null, isCritical: boolean): WaitingTone {
  if (minutes === null) return "unknown";
  const limits = isCritical ? WAITING_THRESHOLDS_MINUTES.critical : WAITING_THRESHOLDS_MINUTES.routine;
  if (minutes >= limits.breach) return "breach";
  if (minutes >= limits.warn) return "warn";
  return "ok";
}

export const WAITING_TONE_CLASSES: Record<WaitingTone, string> = {
  ok: "text-slate-700",
  warn: "text-amber-700",
  breach: "text-red-700 font-semibold",
  unknown: "text-slate-400",
};

/** "29 Oct 2026, 14:35" in the Indian locale. */
export function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** Results the pathologist can authorize from the worklist (backend accepts both). */
export function isSignableStatus(status?: string | null): boolean {
  const value = (status || "").toUpperCase();
  return value === "VERIFIED" || value === "ENTERED" || value === "READY";
}

/** Results still waiting for the technician to enter values. */
export function isAwaitingEntryStatus(status?: string | null): boolean {
  return (status || "").toUpperCase() === "PENDING";
}

/** Results that are already signed or released. */
export function isSignedStatus(status?: string | null): boolean {
  const value = (status || "").toUpperCase();
  return value === "APPROVED" || value === "PUBLISHED" || value === "COMPLETED";
}

/** Compact age / sex label such as "45 Y / M". */
export function formatAgeSex(age?: number | string | null, gender?: string | null): string {
  const parts: string[] = [];
  if (age !== undefined && age !== null && String(age).trim() !== "") parts.push(`${age} Y`);
  const sex = gender ? String(gender).trim().charAt(0).toUpperCase() : "";
  if (sex) parts.push(sex);
  return parts.join(" / ");
}

/** Human readable label for the raw result status coming from the API. */
export function getStatusLabel(status?: string | null): string {
  const value = (status || "").toUpperCase();
  switch (value) {
    case "PENDING":
      return "Awaiting result entry";
    case "ENTERED":
      return "Result entered";
    case "VERIFIED":
    case "READY":
      return "Ready for sign-off";
    case "APPROVED":
      return "Signed & approved";
    case "REJECTED":
      return "Returned";
    case "PUBLISHED":
      return "Published";
    default:
      return status
        ? status.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase())
        : "Ready for sign-off";
  }
}

/** Tailwind classes for the status chip. */
export function getStatusChipClasses(status?: string | null): string {
  const value = (status || "").toUpperCase();
  if (isSignedStatus(value)) return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (value === "REJECTED" || value === "CANCELLED") return "border-red-200 bg-red-50 text-red-800";
  if (value === "VERIFIED" || value === "READY") return "border-sky-200 bg-sky-50 text-sky-800";
  if (value === "ENTERED" || value === "PENDING" || value === "SUBMITTED" || value === "UNDER_REVIEW") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }
  return "border-slate-200 bg-slate-50 text-slate-600";
}
