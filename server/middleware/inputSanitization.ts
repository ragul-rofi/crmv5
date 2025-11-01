import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

const sanitizeString = (str: string): string => {
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
};

const sanitizeObject = (obj: any): any => {
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }
  return obj;
};

export const enhancedInputSanitization = (req: Request, res: Response, next: NextFunction) => {
  // Sanitize body if it exists
  if (req.body && Object.keys(req.body).length > 0) {
    const sanitizedBody = sanitizeObject(req.body);
    // Replace the body content without direct assignment
    Object.keys(req.body).forEach(key => delete req.body[key]);
    Object.assign(req.body, sanitizedBody);
  }
  
  // Sanitize query if it exists
  if (req.query && Object.keys(req.query).length > 0) {
    const sanitizedQuery = sanitizeObject(req.query);
    // Replace the query content without direct assignment
    Object.keys(req.query).forEach(key => delete req.query[key]);
    Object.assign(req.query, sanitizedQuery);
  }
  
  // Sanitize params if it exists
  if (req.params && Object.keys(req.params).length > 0) {
    const sanitizedParams = sanitizeObject(req.params);
    // Replace the params content without direct assignment
    Object.keys(req.params).forEach(key => delete req.params[key]);
    Object.assign(req.params, sanitizedParams);
  }
  
  next();
};

export const validateSchema = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.errors
          },
          timestamp: new Date().toISOString()
        });
      }
      next(error);
    }
  };
};