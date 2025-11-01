import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// Extend Request interface to include session
interface RequestWithSession extends Request {
  session?: {
    csrfToken?: string;
  } & any;
}

export const csrfProtection = (req: RequestWithSession, res: Response, next: NextFunction) => {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }

  const token = req.headers['x-csrf-token'] || req.body._csrf;
  const sessionToken = req.session?.csrfToken;

  if (!token || !sessionToken || token !== sessionToken) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }

  next();
};

export const generateCSRFToken = (req: RequestWithSession, res: Response, next: NextFunction) => {
  if (!req.session?.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }
  next();
};