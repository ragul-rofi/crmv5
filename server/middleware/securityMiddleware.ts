import { Response, NextFunction } from 'express';
import { AuthRequest } from '../auth.js';
import { UserRole, getPermissions } from '../utils/roles.js';
import { sendError } from '../utils/standardResponse.js';
import { query } from '../db.js';
import { safeLog } from '../utils/logger.js';

/**
 * Comprehensive security middleware that combines multiple security checks
 */
export class SecurityMiddleware {
  /**
   * Rate limiting per user to prevent abuse
   */
  private static userRequestCounts = new Map<string, { count: number; resetTime: number }>();
  
  /**
   * Suspicious activity tracking
   */
  private static suspiciousActivity = new Map<string, number>();

  /**
   * Enhanced rate limiting middleware
   */
  static rateLimitByUser(maxRequests: number = 100, windowMs: number = 60000) {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        return next(); // Let auth middleware handle this
      }

      const userId = req.user.id;
      const now = Date.now();
      const userLimit = this.userRequestCounts.get(userId);

      if (!userLimit || now > userLimit.resetTime) {
        this.userRequestCounts.set(userId, {
          count: 1,
          resetTime: now + windowMs
        });
        return next();
      }

      if (userLimit.count >= maxRequests) {
        await this.logSecurityEvent('RATE_LIMIT_EXCEEDED', userId, req, 'medium', {
          requests_in_window: userLimit.count,
          max_allowed: maxRequests,
          window_ms: windowMs
        });
        return sendError(res, 'Rate limit exceeded. Please try again later.', 429);
      }

      userLimit.count++;
      next();
    };
  }

  /**
   * Detect and prevent suspicious activity patterns
   */
  static detectSuspiciousActivity() {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        return next();
      }

      const userId = req.user.id;
      const suspiciousPatterns = [
        // Multiple failed permission checks
        req.path.includes('/admin') && !req.user.role.includes('Admin'),
        // Rapid sequential requests to different endpoints
        req.method === 'DELETE' && !getPermissions(req.user.role as UserRole).canDelete,
        // Accessing finalized data without permission
        req.path.includes('/finalized') && !getPermissions(req.user.role as UserRole).canReadFinalized
      ];

      const suspiciousCount = suspiciousPatterns.filter(Boolean).length;
      
      if (suspiciousCount > 0) {
        const currentCount = this.suspiciousActivity.get(userId) || 0;
        const newCount = currentCount + suspiciousCount;
        this.suspiciousActivity.set(userId, newCount);

        if (newCount >= 5) {
          await this.logSecurityEvent('SUSPICIOUS_ACTIVITY_DETECTED', userId, req, 'high', {
            suspicious_patterns: suspiciousPatterns.length,
            total_suspicious_count: newCount,
            user_role: req.user.role
          });

          // Consider temporarily restricting the user
          if (newCount >= 10) {
            await this.logSecurityEvent('POTENTIAL_SECURITY_THREAT', userId, req, 'critical', {
              total_suspicious_count: newCount,
              recommended_action: 'Account review required'
            });
          }
        }
      }

      next();
    };
  }

  /**
   * Validate request integrity and detect tampering
   */
  static validateRequestIntegrity() {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        return next();
      }

      // Check for common attack patterns in request data
      const suspiciousPatterns = [
        /script\s*>/i,
        /javascript:/i,
        /on\w+\s*=/i,
        /union\s+select/i,
        /drop\s+table/i,
        /delete\s+from/i
      ];

      const requestData = JSON.stringify({
        body: req.body,
        query: req.query,
        params: req.params
      });

      const foundPatterns = suspiciousPatterns.filter(pattern => pattern.test(requestData));

      if (foundPatterns.length > 0) {
        await this.logSecurityEvent('MALICIOUS_REQUEST_DETECTED', req.user.id, req, 'critical', {
          patterns_found: foundPatterns.length,
          request_size: requestData.length,
          user_role: req.user.role
        });

        return sendError(res, 'Request contains potentially malicious content', 400);
      }

      next();
    };
  }

  /**
   * Enhanced session validation
   */
  static validateSession() {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        return next();
      }

      try {
        // Check if user session is still valid
        const sessionResult = await query(
          'SELECT expires_at, is_active FROM user_sessions WHERE user_id = $1 AND is_active = true ORDER BY created_at DESC LIMIT 1',
          [req.user.id]
        );

        if (!sessionResult.rows[0]) {
          await this.logSecurityEvent('INVALID_SESSION', req.user.id, req, 'medium', {
            reason: 'No active session found'
          });
          return sendError(res, 'Session expired. Please log in again.', 401);
        }

        const session = sessionResult.rows[0];
        if (new Date(session.expires_at) < new Date()) {
          await this.logSecurityEvent('EXPIRED_SESSION', req.user.id, req, 'low', {
            expired_at: session.expires_at
          });
          return sendError(res, 'Session expired. Please log in again.', 401);
        }

        next();
      } catch (error) {
        safeLog.error('Session validation error:', error);
        await this.logSecurityEvent('SESSION_VALIDATION_ERROR', req.user?.id || null, req, 'high', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        return sendError(res, 'Session validation failed', 500);
      }
    };
  }

  /**
   * Log security events to database
   */
  private static async logSecurityEvent(
    eventType: string,
    userId: string | null,
    req: AuthRequest,
    severity: 'low' | 'medium' | 'high' | 'critical',
    details: Record<string, any> = {}
  ): Promise<void> {
    try {
      const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
      const userAgent = req.get('User-Agent');
      
      await query(`
        INSERT INTO security_events (event_type, user_id, ip_address, user_agent, details, severity)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        eventType,
        userId,
        ipAddress,
        userAgent,
        JSON.stringify({
          ...details,
          timestamp: new Date().toISOString(),
          url: req.originalUrl,
          method: req.method
        }),
        severity
      ]);

      safeLog.info(`Security event logged: ${eventType}`, {
        userId,
        severity,
        eventType,
        details
      });
    } catch (error) {
      safeLog.error('Failed to log security event:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        eventType,
        userId,
        severity
      });
    }
  }

  /**
   * Clean up old tracking data periodically
   */
  static cleanup() {
    const now = Date.now();
    
    // Clean up rate limiting data
    for (const [userId, data] of this.userRequestCounts.entries()) {
      if (now > data.resetTime) {
        this.userRequestCounts.delete(userId);
      }
    }

    // Reset suspicious activity counts periodically (every hour)
    if (now % (60 * 60 * 1000) < 1000) {
      this.suspiciousActivity.clear();
    }
  }
}

// Set up periodic cleanup
setInterval(() => {
  SecurityMiddleware.cleanup();
}, 60000); // Run every minute