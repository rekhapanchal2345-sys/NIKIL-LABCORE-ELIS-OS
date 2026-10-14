import { z } from "zod";

const identifierField = z
  .string()
  .trim()
  .min(3, "Enter a valid email or employee code")
  .max(120);

export const registerSchema = z.object({
  employeeCode: z.string().trim().min(2).max(50),
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  phone: z
    .string()
    .trim()
    .regex(/^\+91[6-9]\d{9}$/, "Phone must be in +91 format with 10 digits")
    .optional(),
  password: z
    .string()
    .min(12, "Password must be at least 12 characters")
    .max(128),
  role: z.enum([
    "ADMIN",
    "SUPER_ADMIN",
    "BRANCH_ADMIN",
    "FRONT_DESK",
    "LAB_TECH",
    "PATHOLOGIST",
    "DOCTOR",
    "ACCOUNTANT",
    "AUDITOR",
  ]),
});

const loginBase = z.object({
  identifier: identifierField.optional(),
  email: identifierField.optional(),
  password: z
    .string({ message: "Password is required" })
    .min(1, "Password is required")
    .max(128),
});

export const loginSchema = loginBase
  .transform((data) => ({
    identifier: (data.identifier ?? data.email ?? "").trim(),
    password: data.password,
  }))
  .refine((data) => data.identifier.length >= 3, {
    message: "Email or employee code is required",
    path: ["identifier"],
  });

export const mfaVerifySchema = z.object({
  mfaToken: z.string().min(10, "MFA challenge is missing"),
  code: z
    .string()
    .trim()
    .min(6, "Enter the 6-digit code")
    .max(32, "Enter the 6-digit code or a backup code"),
});

export const refreshSchema = z.object({
  refreshToken: z
    .string({ message: "Refresh token is required" })
    .min(20, "Invalid refresh token"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required").max(128),
  newPassword: z
    .string()
    .min(12, "Password must be at least 12 characters")
    .max(128),
});

export const ownerVerifySchema = z.object({
  password: z
    .string({ message: "Password is required" })
    .min(1, "Password is required")
    .max(128),
});

/** Addresses are normalised before validation so Gmail variants all pass. */
const emailField = z
  .string()
  .trim()
  .min(3, "Enter a valid email address")
  .max(254)
  .email("Enter a valid email address");

export const forgotPasswordSchema = z.object({
  email: emailField,
});

export const resetPasswordSchema = z.object({
  email: emailField,
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the 6-digit code from your email"),
  newPassword: z
    .string()
    .min(12, "Password must be at least 12 characters")
    .max(128),
});

export const verifyEmailRequestSchema = z.object({
  email: emailField,
});

export const verifyEmailConfirmSchema = z.object({
  email: emailField,
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the 6-digit code from your email"),
});

export const sessionIdParamSchema = z.object({
  id: z.string().min(1),
});
