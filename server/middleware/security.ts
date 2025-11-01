import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

// Input sanitization
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/javascript:/gi, '')
                .replace(/on\w+\s*=/gi, '');
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        sanitized[key] = sanitize(obj[key]);
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }
  if (req.query) {
    // req.query is read-only, so we sanitize in place
    for (const key in req.query) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitize(req.query[key]);
      }
    }
  }
  if (req.params) {
    // req.params is read-only, so we sanitize in place
    for (const key in req.params) {
      if (typeof req.params[key] === 'string') {
        req.params[key] = sanitize(req.params[key]);
      }
    }
  }

  next();
};

// Enhanced rate limiting for different endpoint types
export const createRateLimit = (windowMs: number, max: number, message: string) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => process.env.NODE_ENV === 'development',
  });
};

// Specific rate limiters
export const authRateLimit = createRateLimit(15 * 60 * 1000, 5, 'Too many authentication attempts');
export const apiRateLimit = createRateLimit(15 * 60 * 1000, 100, 'Too many API requests');
export const uploadRateLimit = createRateLimit(60 * 60 * 1000, 10, 'Too many upload requests');