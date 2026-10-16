import { errorMiddleware } from "./error.middleware";

/**
 * Legacy error handler re-export.
 * Unifies all error handling to error.middleware.ts as the single source of truth.
 */
export const errorHandler = errorMiddleware;
export default errorMiddleware;