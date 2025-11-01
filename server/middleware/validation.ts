import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendError } from '../utils/standardResponse.js';

/**
 * Request sanitization utility
 */
const sanitizeString = (value: any): any => {
  if (typeof value === 'string') {
    // Remove potential XSS patterns
    return value
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }
  
  if (Array.isArray(value)) {
    return value.map(sanitizeString);
  }
  
  if (value && typeof value === 'object') {
    const sanitized: any = {};
    for (const [key, val] of Object.entries(value)) {
      sanitized[key] = sanitizeString(val);
    }
    return sanitized;
  }
  
  return value;
};

/**
 * Middleware to validate request body against a Zod schema
 */
export const validateRequest = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Sanitize request body before validation
      const sanitizedBody = sanitizeString(req.body);
      
      // Validate and parse the request body
      const validated = schema.parse(sanitizedBody);
      
      // Replace request body with validated data (with proper types)
      req.body = validated;
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format validation errors
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));
        
        return sendError(res, 'Validation failed', 400, errors);
      }
      
      // Handle unexpected errors
      console.error('Validation middleware error:', error);
      return sendError(res, 'Internal server error', 500);
    }
  };
};

/**
 * Middleware to validate query parameters
 */
export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Sanitize query parameters before validation
      const sanitizedQuery = sanitizeString(req.query);
      
      // Just validate, don't reassign (req.query is read-only)
      schema.parse(sanitizedQuery);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));
        
        return sendError(res, 'Query validation failed', 400, errors);
      }
      
      console.error('Query validation error:', error);
      return sendError(res, 'Internal server error', 500);
    }
  };
};

/**
 * Middleware to validate URL parameters
 */
export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Sanitize URL parameters before validation
      const sanitizedParams = sanitizeString(req.params);
      
      const validated = schema.parse(sanitizedParams);
      req.params = validated as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));
        
        return sendError(res, 'Parameter validation failed', 400, errors);
      }
      
      console.error('Parameter validation error:', error);
      return sendError(res, 'Internal server error', 500);
    }
  };
};

/**
 * Combined validation middleware for body, query, and params
 */
export const validate = (schemas: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate body if schema provided
      if (schemas.body) {
        const sanitizedBody = sanitizeString(req.body);
        req.body = schemas.body.parse(sanitizedBody);
      }
      
      // Validate query if schema provided
      if (schemas.query) {
        const sanitizedQuery = sanitizeString(req.query);
        req.query = schemas.query.parse(sanitizedQuery) as any;
      }
      
      // Validate params if schema provided
      if (schemas.params) {
        const sanitizedParams = sanitizeString(req.params);
        req.params = schemas.params.parse(sanitizedParams) as any;
      }
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));
        
        return sendError(res, 'Validation failed', 400, errors);
      }
      
      console.error('Combined validation error:', error);
      return sendError(res, 'Internal server error', 500);
    }
  };
};
