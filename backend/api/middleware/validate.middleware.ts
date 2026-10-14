import { Request, Response, NextFunction } from "express";
import { z, ZodType } from "zod";

export type ValidationSchemas = {
  body?: any;
  params?: any;
  query?: any;
};

/**
 * Safely resolves a Zod schema from a target key ('body' | 'params' | 'query'),
 * unwrapping any nested layers of wrapping (e.g. { body: { body: schema } }).
 */
function extractZodSchema(target: any, key: 'body' | 'params' | 'query'): any {
  if (!target) return undefined;

  // If target itself is a Zod schema (has safeParse)
  if (typeof target.safeParse === 'function') {
    return target;
  }

  // Look directly on target
  let candidate = target[key];

  // If not found directly, check if target has a 'body' containing the key (e.g. target.body.params)
  if (!candidate && target.body && target.body[key]) {
    candidate = target.body[key];
  }

  // Unwrap nested layers (up to 5 levels)
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

export const validate = (schemas: ValidationSchemas | any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!schemas) {
        return next();
      }

      // If schemas itself is a direct Zod schema (e.g. z.object(...))
      if (typeof schemas.safeParse === 'function') {
        const result = schemas.safeParse({
          body: req.body,
          params: req.params,
          query: req.query,
        });

        if (!result.success) {
          const errors = result.error.issues
            ? result.error.issues.map((i: any) => ({
                path: i.path.join('.'),
                message: i.message,
              }))
            : result.error.format();

          return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors,
          });
        }

        const parsed = result.data as any;
        if (parsed.body !== undefined) req.body = parsed.body;
        if (parsed.params !== undefined) Object.assign(req.params, parsed.params);
        if (parsed.query !== undefined) {
          Object.keys(req.query).forEach((k) => delete req.query[k]);
          Object.assign(req.query, parsed.query);
        }
        return next();
      }

      const validated: any = {};

      // 1. Validate Body
      const bodySchema = extractZodSchema(schemas, 'body');
      if (bodySchema) {
        const result = bodySchema.safeParse(req.body);
        if (!result.success) {
          console.log("Validation error details (body):", result.error);
          return res.status(400).json({
            success: false,
            message: "Invalid request body",
            errors: result.error.format ? result.error.format() : result.error,
          });
        }
        validated.body = result.data;
        req.body = result.data;
      }

      // 2. Validate Params
      const paramsSchema = extractZodSchema(schemas, 'params');
      if (paramsSchema) {
        const result = paramsSchema.safeParse(req.params);
        if (!result.success) {
          console.log("Validation error details (params):", result.error);
          return res.status(400).json({
            success: false,
            message: "Invalid request parameters",
            errors: result.error.format ? result.error.format() : result.error,
          });
        }
        validated.params = result.data;
        Object.assign(req.params, result.data);
      }

      // 3. Validate Query
      const querySchema = extractZodSchema(schemas, 'query');
      if (querySchema) {
        const result = querySchema.safeParse(req.query);
        if (!result.success) {
          console.log("Validation error details (query):", result.error);
          return res.status(400).json({
            success: false,
            message: "Invalid query parameters",
            errors: result.error.format ? result.error.format() : result.error,
          });
        }
        validated.query = result.data;
        Object.keys(req.query).forEach((key) => {
          delete req.query[key];
        });
        Object.assign(req.query, result.data);
      }

      // Attach validated data to request object
      (req as any).validated = validated;

      next();
    } catch (error) {
      console.error('Validation middleware error:', error);
      next(error);
    }
  };
};