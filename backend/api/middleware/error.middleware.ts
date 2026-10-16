import type {
  Request,
  Response,
  NextFunction,
  ErrorRequestHandler,
} from "express";

import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { TokenExpiredError, JsonWebTokenError } from "jsonwebtoken";

/**
 * =========================================
 * APPLICATION ERROR TYPE
 * =========================================
 */

interface ApplicationError
  extends Error {
  statusCode?: number;
  status?: number;
  code?: string;
}

/**
 * =========================================
 * GLOBAL ERROR MIDDLEWARE
 * =========================================
 *
 * IMPORTANT:
 * This middleware must be registered LAST
 * after all routes and 404 middleware.
 */
export const errorMiddleware: ErrorRequestHandler =
  (
    err: unknown,
    req: Request,
    res: Response,
    _next: NextFunction
  ): void => {
    /**
     * ---------------------------------------
     * Logging
     * ---------------------------------------
     */
    console.error("LabCore ELIS Error", {
      method: req.method,
      url: req.originalUrl,
      error: err,
    });

    /**
     * ---------------------------------------
     * Headers already sent
     * ---------------------------------------
     *
     * Express has already started sending
     * the response. Let Express handle it.
     */
    if (res.headersSent) {
      return;
    }

    /**
     * =======================================
     * JWT ERROR
     * =======================================
     */
    if (
      err instanceof TokenExpiredError ||
      err instanceof JsonWebTokenError
    ) {
      res.status(401).json({
        success: false,
        message:
          err instanceof TokenExpiredError
            ? "Access token has expired."
            : "Invalid access token.",
        code:
          err instanceof TokenExpiredError
            ? "TOKEN_EXPIRED"
            : "TOKEN_INVALID",
      });

      return;
    }

    /**
     * =======================================
     * ZOD VALIDATION ERROR
     * =======================================
     */
    if (err instanceof ZodError) {
      res.status(400).json({
        success: false,
        message:
          "Validation failed.",
        errors: err.issues.map(
          (issue) => ({
            path:
              issue.path.join("."),
            message:
              issue.message,
          })
        ),
      });

      return;
    }

    /**
     * =======================================
     * PRISMA KNOWN REQUEST ERROR
     * =======================================
     */
    if (
      err instanceof
      Prisma.PrismaClientKnownRequestError
    ) {
      switch (err.code) {
        /**
         * Unique constraint
         */
        case "P2002": {
          const target =
            Array.isArray(
              err.meta?.target
            )
              ? err.meta.target.join(
                  ", "
                )
              : undefined;

          res.status(409).json({
            success: false,
            message:
              target
                ? `A record with the same ${target} already exists.`
                : "A record with this value already exists.",
            code: err.code,
          });

          return;
        }

        /**
         * Record not found
         */
        case "P2025": {
          res.status(404).json({
            success: false,
            message:
              "Requested record was not found.",
            code: err.code,
          });

          return;
        }

        /**
         * Foreign key constraint
         */
        case "P2003": {
          // Try to provide more specific error message
          const field = err.meta?.field_name as string;
          let specificMessage = "Related record does not exist.";

          if (field) {
            if (field.includes('createdById') || field.includes('createdBy')) {
              specificMessage = "User account not found or inactive. Please check your authentication.";
            } else if (field.includes('doctorId') || field.includes('referredBy')) {
              specificMessage = "Referring doctor not found. Please select a valid doctor.";
            } else if (field.includes('collectedById') || field.includes('collectedBy')) {
              specificMessage = "Sample collector not found. Please select a valid staff member.";
            } else if (field.includes('patientId')) {
              specificMessage = "Patient record not found. Please check the patient details.";
            } else if (field.includes('testId')) {
              specificMessage = "Test not found. Please select a valid test.";
            }
          }

          res.status(400).json({
            success: false,
            message: specificMessage,
            code: err.code,
          });

          return;
        }

        /**
         * Required relation violation
         */
        case "P2014": {
          res.status(400).json({
            success: false,
            message:
              "The requested change violates a required relationship.",
            code: err.code,
          });

          return;
        }

        /**
         * Invalid field value
         */
        case "P2006": {
          res.status(400).json({
            success: false,
            message:
              "Invalid value provided for a database field.",
            code: err.code,
          });

          return;
        }

        /**
         * Record required but not found
         */
        case "P2018": {
          res.status(404).json({
            success: false,
            message:
              "Required related records were not found.",
            code: err.code,
          });

          return;
        }

        /**
         * Database constraint failed
         */
        case "P2021": {
          res.status(500).json({
            success: false,
            message:
              "Database table does not exist.",
            code: err.code,
          });

          return;
        }

        /**
         * Default
         */
        default: {
          console.error('Unhandled Prisma error code:', err.code, err.meta);
          res.status(500).json({
            success: false,
            message:
              "The database rejected this request. Please retry or contact support.",
            ...(process.env.NODE_ENV === 'development'
              ? { code: err.code, details: err.meta }
              : {}),
          });

          return;
        }
      }
    }

    /**
     * =======================================
     * PRISMA VALIDATION ERROR
     * =======================================
     */
    if (
      err instanceof
      Prisma.PrismaClientValidationError
    ) {
      console.error('Prisma Validation Error:', err.message);

      res.status(400).json({
        success: false,
        message: "The request contained invalid or missing data.",
        ...(process.env.NODE_ENV === 'development'
          ? { details: err.message }
          : {})
      });

      return;
    }

    /**
     * =======================================
     * PRISMA INITIALIZATION ERROR
     * =======================================
     */
    if (
      err instanceof
      Prisma.PrismaClientInitializationError
    ) {
      res.status(503).json({
        success: false,
        message:
          "Database service is currently unavailable.",
      });

      return;
    }

    /**
     * =======================================
     * PRISMA UNKNOWN REQUEST ERROR
     * =======================================
     */
    if (
      err instanceof
      Prisma.PrismaClientUnknownRequestError
    ) {
      res.status(500).json({
        success: false,
        message:
          "Unknown database error occurred.",
      });

      return;
    }

    /**
     * =======================================
     * PRISMA RUNTIME ERROR
     * =======================================
     */
    if (
      err instanceof
      Prisma.PrismaClientRustPanicError
    ) {
      res.status(500).json({
        success: false,
        message:
          "Database engine encountered an unexpected error.",
      });

      return;
    }

    /**
     * =======================================
     * CUSTOM APPLICATION ERROR
     * =======================================
     */
    if (
      err instanceof Error
    ) {
      const applicationError =
        err as ApplicationError;

      let inferredStatusCode =
        applicationError.statusCode ??
        applicationError.status;

      if (!inferredStatusCode) {
        const msg = (applicationError.message || '').toLowerCase();
        if (
          msg.includes('not found') ||
          msg.includes('does not exist') ||
          msg.includes('no record') ||
          msg.includes('cannot find')
        ) {
          inferredStatusCode = 404;
        } else if (
          msg.includes('already exists') ||
          msg.includes('duplicate') ||
          msg.includes('conflict') ||
          msg.includes('in-flight')
        ) {
          inferredStatusCode = 409;
        } else if (
          msg.includes('forbidden') ||
          msg.includes('permission') ||
          msg.includes('access denied') ||
          msg.includes('unauthorized role')
        ) {
          inferredStatusCode = 403;
        } else if (
          msg.includes('unauthorized') ||
          msg.includes('unauthenticated') ||
          msg.includes('login required')
        ) {
          inferredStatusCode = 401;
        } else if (
          msg.includes('invalid') ||
          msg.includes('required') ||
          msg.includes('missing') ||
          msg.includes('bad request') ||
          msg.includes('cannot exceed') ||
          msg.includes('exceeds') ||
          msg.includes('overpayment') ||
          msg.includes('must be')
        ) {
          inferredStatusCode = 400;
        } else {
          inferredStatusCode = 500;
        }
      }

      /**
       * Prevent invalid HTTP status codes.
       */
      const safeStatusCode =
        inferredStatusCode >= 400 &&
        inferredStatusCode <= 599
          ? inferredStatusCode
          : 500;

      const isServerError = safeStatusCode >= 500;
      const isDevelopment = process.env.NODE_ENV === "development";

      const response: {
        success: false;
        message: string;
        code?: string;
        stack?: string;
      } = {
        success: false,

        /**
         * Client errors carry a user-facing message; internal failures are
         * never described to the caller in production.
         */
        message:
          isServerError && !isDevelopment
            ? "Internal Server Error"
            : applicationError.message || "Internal Server Error",
      };

      /**
       * Include custom error code
       * when available.
       */
      if (
        applicationError.code
      ) {
        response.code =
          applicationError.code;
      }

      /**
       * Stack only for server errors in development.
       */
      if (
        isDevelopment &&
        isServerError &&
        applicationError.stack
      ) {
        response.stack =
          applicationError.stack;
      }

      res
        .status(safeStatusCode)
        .json(response);

      return;
    }

    /**
     * =======================================
     * UNKNOWN / NON-ERROR OBJECT
     * =======================================
     */
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      ...(process.env.NODE_ENV === 'development' ? {
        details: typeof err === 'object' ? JSON.stringify(err) : String(err)
      } : {})
    });
  };

export default errorMiddleware;