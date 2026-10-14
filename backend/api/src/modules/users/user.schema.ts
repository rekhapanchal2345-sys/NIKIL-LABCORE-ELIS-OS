import { z } from "zod";

/**
 * Prisma UserRole:
 *
 * ADMIN
 * FRONT_DESK
 * LAB_TECH
 * PATHOLOGIST
 * DOCTOR
 */

export const userRoleSchema = z.enum([
  "ADMIN",
  "SUPER_ADMIN",
  "BRANCH_ADMIN",
  "FRONT_DESK",
  "LAB_TECH",
  "PATHOLOGIST",
  "DOCTOR",
  "ACCOUNTANT",
  "AUDITOR",
]);

/**
 * Prisma AccountStatus:
 *
 * ACTIVE
 * INACTIVE
 * SUSPENDED
 * LOCKED
 */

export const accountStatusSchema = z.enum([
  "ACTIVE",
  "INACTIVE",
  "SUSPENDED",
  "LOCKED",
]);

/**
 * Create User
 */
export const createUserSchema = {
  body: z.object({
    employeeCode: z
      .string()
      .trim()
      .min(
        1,
        "Employee code is required."
      )
      .max(50),

    fullName: z
      .string()
      .trim()
      .min(
        2,
        "Full name must contain at least 2 characters."
      )
      .max(150),

    email: z
      .string()
      .trim()
      .email("Invalid email address.")
      .max(255)
      .transform((value) =>
        value.toLowerCase()
      ),

    phone: z
      .string()
      .trim()
      .regex(
        /^\+91[6-9]\d{9}$/,
        "Invalid phone number. Must be +91 followed by 10 digits."
      )
      .nullable()
      .optional(),

    password: z
      .string()
      .min(
        12,
        "Password must contain at least 12 characters."
      )
      .max(100)
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,}$/,
        "Password must include uppercase, lowercase, a number, and a symbol."
      ),

    role: userRoleSchema,

    status:
      accountStatusSchema
        .optional()
        .default("ACTIVE"),

    specialization: z
      .string()
      .trim()
      .max(150)
      .nullable()
      .optional(),
  }),
};

/**
 * Update User
 *
 * Password is optional here.
 * If password is omitted, existing password
 * remains unchanged.
 */
export const updateUserSchema = {
  params: z.object({
    id: z
      .string()
      .trim()
      .min(
        1,
        "User ID is required."
      ),
  }),

  body: z.object({
    employeeCode: z
      .string()
      .trim()
      .min(1)
      .max(50)
      .optional(),

    fullName: z
      .string()
      .trim()
      .min(2)
      .max(150)
      .optional(),

    email: z
      .string()
      .trim()
      .email(
        "Invalid email address."
      )
      .max(255)
      .transform((value) =>
        value.toLowerCase()
      )
      .optional(),

    phone: z
      .string()
      .trim()
      .regex(
        /^\+91[6-9]\d{9}$/,
        "Invalid phone number. Must be +91 followed by 10 digits."
      )
      .nullable()
      .optional(),

    password: z
      .string()
      .min(
        12,
        "Password must contain at least 12 characters."
      )
      .max(100)
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,}$/,
        "Password must include uppercase, lowercase, a number, and a symbol."
      )
      .optional(),

    role: userRoleSchema.optional(),

    status:
      accountStatusSchema.optional(),

    specialization: z
      .string()
      .trim()
      .max(150)
      .nullable()
      .optional(),
  }),
};

/**
 * User ID
 */
export const userIdSchema = {
  params: z.object({
    id: z
      .string()
      .trim()
      .min(
        1,
        "User ID is required."
      ),
  }),
};

/**
 * User List / Search
 */
export const userListSchema = {
  query: z.object({
    search: z
      .string()
      .trim()
      .max(150)
      .optional(),

    role: userRoleSchema.optional(),

    status:
      accountStatusSchema.optional(),

    page: z.coerce
      .number()
      .int()
      .min(1)
      .default(1),

    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .default(20),
  }),
};

export type CreateUserInput =
  z.infer<
    typeof createUserSchema.body
  >;

export type UpdateUserInput =
  z.infer<
    typeof updateUserSchema.body
  >;

export type UserListInput =
  z.infer<
    typeof userListSchema.query
  >;