import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  error?: string;
  timestamp: string;
  requestId?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

/**
 * Send a successful response with standardized format
 */
export const sendSuccess = <T>(
  res: Response,
  data: T,
  pagination?: PaginationMeta,
  statusCode: number = 200
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
    requestId: res.locals.requestId || uuidv4()
  };

  if (pagination) {
    response.pagination = pagination;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send an error response with standardized format
 */
export const sendError = (
  res: Response,
  error: string,
  statusCode: number = 500,
  details?: any
): Response => {
  const response: ApiResponse<null> = {
    success: false,
    data: null,
    error,
    timestamp: new Date().toISOString(),
    requestId: res.locals.requestId || uuidv4()
  };

  // Add details for validation errors
  if (details && statusCode === 400) {
    (response as any).details = details;
  }

  return res.status(statusCode).json(response);
};

/**
 * Middleware to add request ID to all responses
 */
export const addRequestId = (req: any, res: Response, next: any) => {
  res.locals.requestId = uuidv4();
  next();
};

/**
 * Wrapper for async route handlers to ensure consistent error handling
 */
export const asyncHandler = (fn: Function) => {
  return (req: any, res: Response, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Global error handler middleware
 */
export const globalErrorHandler = (err: any, req: any, res: Response, next: any) => {
  console.error('Global error handler:', err);

  // Handle different types of errors
  if (err.name === 'ValidationError') {
    return sendError(res, 'Validation failed', 400, err.details);
  }

  if (err.name === 'UnauthorizedError' || err.status === 401) {
    return sendError(res, 'Unauthorized access', 401);
  }

  if (err.name === 'ForbiddenError' || err.status === 403) {
    return sendError(res, 'Forbidden access', 403);
  }

  if (err.name === 'NotFoundError' || err.status === 404) {
    return sendError(res, 'Resource not found', 404);
  }

  // Default server error
  return sendError(res, 'Internal server error', 500);
};

/**
 * 404 handler for unmatched routes
 */
export const notFoundHandler = (req: any, res: Response) => {
  return sendError(res, `Route ${req.method} ${req.path} not found`, 404);
};