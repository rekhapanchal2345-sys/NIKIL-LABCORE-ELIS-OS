import type {
  Request,
  Response,
  NextFunction,
  RequestHandler,
} from "express";

export interface ValidationSchemaObject {
  body?: any;
  params?: any;
  query?: any;
}

function extractZodSchema(target: any, key: 'body' | 'params' | 'query'): any {
  if (!target) return undefined;

  if (typeof target.safeParse === 'function') {
    return target;
  }

  let candidate = target[key];

  if (!candidate && target.body && target.body[key]) {
    candidate = target.body[key];
  }

  let depth = 0;
  while (candidate && typeof candidate.safeParse !== 'function' && typeof candidate === 'object' && depth < 5) {
    if (candidate[key]) {
      candidate = candidate[key];
    } else {
      break;
    }
    depth++;
  }

  if (candidate && typeof candidate.safeParse === 'function') {
    return candidate;
  }

  return undefined;
}

export const validate = (
  schema: any
): RequestHandler => {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    if (!schema) {
      return next();
    }

    // Case 1: Schema is a single Zod schema with .safeParse
    if (typeof schema.safeParse === "function") {
      const result = schema.safeParse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      if (!result.success) {
        const errors = result.error.issues.map(
          (issue: any) => ({
            path: issue.path.join("."),
            message: issue.message,
          })
        );

        res.status(400).json({
          success: false,
          message: "Validation failed.",
          errors,
        });

        return;
      }

      const parsed = result.data as {
        body?: unknown;
        query?: unknown;
        params?: unknown;
      };

      if (parsed.body !== undefined) {
        req.body = parsed.body;
      }

      if (parsed.params !== undefined) {
        Object.assign(req.params, parsed.params);
      }

      if (parsed.query !== undefined) {
        Object.keys(req.query).forEach((key) => {
          delete req.query[key];
        });
        Object.assign(req.query, parsed.query);
      }

      return next();
    }

    // Case 2: Schema is an object containing { body, params, query }
    if (typeof schema === "object") {
      const validated: any = {};

      const bodySchema = extractZodSchema(schema, 'body');
      if (bodySchema) {
        const result = bodySchema.safeParse(req.body);
        if (!result.success) {
          res.status(400).json({
            success: false,
            message: "Invalid request body",
            errors: result.error.format ? result.error.format() : result.error,
          });
          return;
        }
        validated.body = result.data;
        req.body = result.data;
      }

      const paramsSchema = extractZodSchema(schema, 'params');
      if (paramsSchema) {
        const result = paramsSchema.safeParse(req.params);
        if (!result.success) {
          res.status(400).json({
            success: false,
            message: "Invalid request parameters",
            errors: result.error.format ? result.error.format() : result.error,
          });
          return;
        }
        validated.params = result.data;
        Object.assign(req.params, result.data);
      }

      const querySchema = extractZodSchema(schema, 'query');
      if (querySchema) {
        const result = querySchema.safeParse(req.query);
        if (!result.success) {
          res.status(400).json({
            success: false,
            message: "Invalid query parameters",
            errors: result.error.format ? result.error.format() : result.error,
          });
          return;
        }
        validated.query = result.data;
        Object.keys(req.query).forEach((key) => {
          delete req.query[key];
        });
        Object.assign(req.query, result.data);
      }

      (req as any).validated = validated;
      return next();
    }

    next();
  };
};