import { Request, Response, NextFunction } from 'express';
// Redis removed; no-op cache middleware
import { safeLog } from '../utils/logger.js';

interface CacheOptions {
  ttl?: number;
  keyGenerator?: (req: Request) => string;
  condition?: (req: Request) => boolean;
}

export const cacheMiddleware = (_options: CacheOptions = {}) => {
  return async (_req: Request, _res: Response, next: NextFunction) => next();
};