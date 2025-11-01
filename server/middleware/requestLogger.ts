import { Request, Response, NextFunction } from 'express';
import { safeLog } from '../utils/logger.js';
import { randomUUID } from 'crypto';

declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
    }
  }
}

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const correlationId = randomUUID();
  req.correlationId = correlationId;
  
  const startTime = Date.now();
  
  // Log request
  safeLog.info('Incoming request', {
    correlationId,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(body: any) {
    const duration = Date.now() - startTime;
    
    safeLog.info('Outgoing response', {
      correlationId,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
    
    return originalJson.call(this, body);
  };

  next();
};