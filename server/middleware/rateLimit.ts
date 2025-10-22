import rateLimit from 'express-rate-limit';

/**
 * General API rate limiter
 * In development: Very high limit to allow for hot reload and frequent requests
 * In production: Limits each IP to 100 requests per 15 minutes
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Higher limit in development
  message: {
    error: 'Too many requests from this IP, please try again after 15 minutes',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

/**
 * Strict rate limiter for authentication endpoints
 * In development: Moderate limit to allow testing
 * In production: Limits each IP to 5 login attempts per 15 minutes
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 5 : 50, // Higher limit in development
  message: {
    error: 'Too many login attempts from this IP, please try again after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

/**
 * Moderate rate limiter for data creation endpoints
 * In development: High limit to allow testing
 * In production: Limits each IP to 30 requests per 15 minutes
 */
export const createLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 30 : 300, // Higher limit in development
  message: {
    error: 'Too many creation requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
