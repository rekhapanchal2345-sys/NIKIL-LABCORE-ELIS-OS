import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/* =======================================================
   CLASS NAME UTILITY
======================================================= */

export function cn(
  ...inputs: ClassValue[]
): string {
  return twMerge(clsx(inputs));
}

/* =======================================================
   STRING UTILITIES
======================================================= */

export function capitalize(
  value: string
): string {
  if (!value) return "";

  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  );
}

export function capitalizeWords(
  value: string
): string {
  if (!value) return "";

  return value
    .trim()
    .split(/\s+/)
    .map((word) => capitalize(word))
    .join(" ");
}

export function truncate(
  value: string,
  maxLength: number
): string {
  if (!value) return "";

  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength).trim()}...`;
}

export function slugify(
  value: string
): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/* =======================================================
   NUMBER UTILITIES
======================================================= */

export function formatNumber(
  value: number | string,
  decimals = 0
): string {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "0";
  }

  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(number);
}

export function formatCurrency(
  value: number | string,
  currency = "INR"
): string {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "₹0.00";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number);
}

export function formatPercentage(
  value: number | string,
  decimals = 2
): string {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "0%";
  }

  return `${number.toFixed(decimals)}%`;
}

export function clamp(
  value: number,
  min: number,
  max: number
): number {
  return Math.min(
    Math.max(value, min),
    max
  );
}

/* =======================================================
   DATE UTILITIES
======================================================= */

export const DEFAULT_CLINICAL_TIMEZONE = "Asia/Kolkata";

/**
 * Bug 6.3: Formats date with explicit Asia/Kolkata timezone to prevent
 * Next.js SSR / Client hydration mismatches (UTC server vs IST client).
 */
export function formatDate(
  value: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: DEFAULT_CLINICAL_TIMEZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
  };

  return new Intl.DateTimeFormat(
    "en-IN",
    options ? { timeZone: DEFAULT_CLINICAL_TIMEZONE, ...options } : defaultOptions
  ).format(date);
}

export function formatDateTime(
  value: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: DEFAULT_CLINICAL_TIMEZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };

  return new Intl.DateTimeFormat(
    "en-IN",
    options ? { timeZone: DEFAULT_CLINICAL_TIMEZONE, ...options } : defaultOptions
  ).format(date);
}

export function formatTime(
  value: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: DEFAULT_CLINICAL_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
  };

  return new Intl.DateTimeFormat(
    "en-IN",
    options ? { timeZone: DEFAULT_CLINICAL_TIMEZONE, ...options } : defaultOptions
  ).format(date);
}

export function toDateInputValue(
  value: string | Date | null | undefined
): string {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  // Format in Asia/Kolkata date format YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: DEFAULT_CLINICAL_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function getAge(
  dateOfBirth: string | Date
): number {
  const birthDate = new Date(dateOfBirth);

  if (Number.isNaN(birthDate.getTime())) {
    return 0;
  }

  const today = new Date();

  let age =
    today.getFullYear() -
    birthDate.getFullYear();

  const monthDifference =
    today.getMonth() -
    birthDate.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 &&
      today.getDate() <
        birthDate.getDate())
  ) {
    age--;
  }

  return Math.max(age, 0);
}

/* =======================================================
   PATIENT UTILITIES
======================================================= */

export function getPatientDisplayName(
  firstName?: string | null,
  lastName?: string | null,
  middleName?: string | null
): string {
  return [firstName, middleName, lastName]
    .filter(Boolean)
    .join(" ")
    .trim() || "Unknown Patient";
}

export function getPatientInitials(
  name: string
): string {
  if (!name) return "?";

  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 1) {
    return words[0]
      .substring(0, 2)
      .toUpperCase();
  }

  return (
    words[0][0] +
    words[words.length - 1][0]
  ).toUpperCase();
}

/* =======================================================
   ID UTILITIES
======================================================= */

export function generateId(
  prefix = "ID"
): string {
  const random =
    Math.random()
      .toString(36)
      .substring(2, 10)
      .toUpperCase();

  return `${prefix}-${random}`;
}

export function generateReferenceNumber(
  prefix: string
): string {
  const date = new Date();

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const random = Math.floor(
    100000 + Math.random() * 900000
  );

  return `${prefix}-${year}${month}-${random}`;
}

/* =======================================================
   OBJECT UTILITIES
======================================================= */

export function isEmpty(
  value:
    | string
    | unknown[]
    | Record<string, unknown>
    | null
    | undefined
): boolean {
  if (value == null) {
    return true;
  }

  if (typeof value === "string") {
    return value.trim().length === 0;
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  if (typeof value === "object") {
    return Object.keys(value).length === 0;
  }

  return false;
}

export function omit<
  T extends Record<string, unknown>,
  K extends keyof T
>(
  object: T,
  keys: K[]
): Omit<T, K> {
  const result = {
    ...object,
  } as Omit<T, K>;

  keys.forEach((key) => {
    delete (
      result as Record<string, unknown>
    )[key as string];
  });

  return result;
}

export function pick<
  T extends Record<string, unknown>,
  K extends keyof T
>(
  object: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;

  keys.forEach((key) => {
    if (key in object) {
      result[key] = object[key];
    }
  });

  return result;
}

/* =======================================================
   ARRAY UTILITIES
======================================================= */

export function unique<T>(
  array: T[]
): T[] {
  return Array.from(new Set(array));
}

export function uniqueBy<T>(
  array: T[],
  key: keyof T
): T[] {
  const seen = new Set<unknown>();

  return array.filter((item) => {
    const value = item[key];

    if (seen.has(value)) {
      return false;
    }

    seen.add(value);
    return true;
  });
}

/* =======================================================
   FILE UTILITIES
======================================================= */

export function formatFileSize(
  bytes: number
): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return "0 Bytes";
  }

  if (bytes === 0) {
    return "0 Bytes";
  }

  const units = [
    "Bytes",
    "KB",
    "MB",
    "GB",
    "TB",
  ];

  const index = Math.floor(
    Math.log(bytes) /
      Math.log(1024)
  );

  const size =
    bytes /
    Math.pow(1024, index);

  return `${size.toFixed(
    index === 0 ? 0 : 2
  )} ${units[index]}`;
}

export function getFileExtension(
  filename: string
): string {
  if (!filename) return "";

  const parts =
    filename.split(".");

  if (parts.length <= 1) {
    return "";
  }

  return (
    parts[parts.length - 1] ?? ""
  ).toLowerCase();
}

export function isImageFile(
  filename: string
): boolean {
  const extension =
    getFileExtension(filename);

  return [
    "jpg",
    "jpeg",
    "png",
    "gif",
    "webp",
    "bmp",
    "svg",
  ].includes(extension);
}

export function isPdfFile(
  filename: string
): boolean {
  return (
    getFileExtension(filename) ===
    "pdf"
  );
}

/* =======================================================
   DEBOUNCE
======================================================= */

export function debounce<
  T extends (
    ...args: never[]
  ) => unknown
>(
  callback: T,
  delay: number
) {
  let timeoutId:
    | ReturnType<typeof setTimeout>
    | undefined;

  return (
    ...args: Parameters<T>
  ) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      callback(...args);
    }, delay);
  };
}

/* =======================================================
   URL UTILITIES
======================================================= */

export function buildQueryString(
  params: Record<
    string,
    string | number | boolean | null | undefined
  >
): string {
  const searchParams =
    new URLSearchParams();

  Object.entries(params).forEach(
    ([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        searchParams.set(
          key,
          String(value)
        );
      }
    }
  );

  const query =
    searchParams.toString();

  return query ? `?${query}` : "";
}

/* =======================================================
   VALIDATION UTILITIES
======================================================= */

export function isValidEmail(
  email: string
): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email.trim()
  );
}

export function isValidPhone(
  phone: string
): boolean {
  const cleaned =
    phone.replace(/\D/g, "");

  return (
    cleaned.length >= 10 &&
    cleaned.length <= 15
  );
}

export function isValidPAN(
  pan: string
): boolean {
  return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(
    pan.trim().toUpperCase()
  );
}

export function isValidAadhaar(
  aadhaar: string
): boolean {
  const cleaned =
    aadhaar.replace(/\s/g, "");

  return /^\d{12}$/.test(cleaned);
}

/* =======================================================
   LAB / ELIS UTILITIES
======================================================= */

export function getStatusVariant(
  status: string
):
  | "default"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "secondary"
  | "outline" {
  const normalized =
    status.toLowerCase().trim();

  if (
    [
      "active",
      "approved",
      "completed",
      "paid",
      "success",
      "verified",
      "available",
      "normal",
      "released",
    ].includes(normalized)
  ) {
    return "success";
  }

  if (
    [
      "pending",
      "processing",
      "waiting",
      "partial",
      "due",
      "review",
      "in progress",
    ].includes(normalized)
  ) {
    return "warning";
  }

  if (
    [
      "failed",
      "error",
      "rejected",
      "cancelled",
      "canceled",
      "inactive",
      "blocked",
      "critical",
    ].includes(normalized)
  ) {
    return "error";
  }

  if (
    [
      "new",
      "info",
      "scheduled",
      "draft",
      "collected",
      "received",
    ].includes(normalized)
  ) {
    return "info";
  }

  return "default";
}

export function getGenderLabel(
  gender?: string | null
): string {
  if (!gender) return "-";

  const normalized =
    gender.toLowerCase();

  const labels: Record<
    string,
    string
  > = {
    male: "Male",
    female: "Female",
    other: "Other",
    unknown: "Unknown",
  };

  return (
    labels[normalized] ??
    capitalizeWords(gender)
  );
}

/* =======================================================
   SAFE JSON
======================================================= */

export function safeJsonParse<T>(
  value: string,
  fallback: T
): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

/* =======================================================
   EXPORT OBJECT
======================================================= */

export const utils = {
  cn,
  capitalize,
  capitalizeWords,
  truncate,
  slugify,
  formatNumber,
  formatCurrency,
  formatPercentage,
  clamp,
  formatDate,
  formatDateTime,
  formatTime,
  toDateInputValue,
  getAge,
  getPatientDisplayName,
  getPatientInitials,
  generateId,
  generateReferenceNumber,
  isEmpty,
  omit,
  pick,
  unique,
  uniqueBy,
  formatFileSize,
  getFileExtension,
  isImageFile,
  isPdfFile,
  debounce,
  buildQueryString,
  isValidEmail,
  isValidPhone,
  isValidPAN,
  isValidAadhaar,
  getStatusVariant,
  getGenderLabel,
  safeJsonParse,
};

export default utils;