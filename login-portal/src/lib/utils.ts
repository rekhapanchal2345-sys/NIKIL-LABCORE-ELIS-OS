// ============================================================
// PASSWORD UTILS
// ============================================================

import type { PasswordStrength } from "../types/auth";

const COMMON_PATTERNS = [
  /^password/i, /^123/, /^admin/i, /^qwerty/i, /^letmein/i,
  /^welcome/i, /^monkey/i, /^dragon/i,
];

export function analyzePassword(password: string): PasswordStrength {
  if (!password) {
    return { score: 0, label: "Very Weak", color: "#ef4444", suggestions: [] };
  }

  const suggestions: string[] = [];
  let score = 0;

  if (password.length >= 12) score++;
  else suggestions.push("Use at least 12 characters");

  if (password.length >= 16) score++;

  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  else suggestions.push("Mix uppercase and lowercase letters");

  if (/\d/.test(password)) score++;
  else suggestions.push("Include at least one number");

  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) score++;
  else suggestions.push("Add special characters (!@#$%^&*)");

  if (COMMON_PATTERNS.some((p) => p.test(password))) {
    score = Math.max(0, score - 2);
    suggestions.push("Avoid common password patterns");
  }

  const clamped = Math.min(4, Math.max(0, score)) as 0 | 1 | 2 | 3 | 4;
  const labels: PasswordStrength["label"][] = [
    "Very Weak", "Weak", "Fair", "Strong", "Very Strong",
  ];
  const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#10b981"];

  return {
    score: clamped,
    label: labels[clamped],
    color: colors[clamped],
    suggestions,
  };
}

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

export function parseUserAgent(ua: string | null): string {
  if (!ua) return "Unknown device";
  if (/mobile/i.test(ua)) {
    if (/android/i.test(ua)) return "Android Mobile";
    if (/iphone/i.test(ua)) return "iPhone";
    return "Mobile Device";
  }
  if (/chrome/i.test(ua)) return "Chrome Browser";
  if (/firefox/i.test(ua)) return "Firefox Browser";
  if (/safari/i.test(ua)) return "Safari Browser";
  if (/edge/i.test(ua)) return "Edge Browser";
  return "Desktop Browser";
}
