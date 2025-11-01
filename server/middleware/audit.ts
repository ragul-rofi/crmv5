import { Request, Response, NextFunction } from 'express';
import { query } from '../db.js';
import { AuthRequest } from '../auth.js';
import { safeLog } from '../utils/logger.js';

export const auditMiddleware = (entityType: string, options: {
  logFailures?: boolean;
  logSensitiveOperations?: boolean;
  includeRequestBody?: boolean;
} = {}) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const originalJson = res.json;
    const startTime = Date.now();
    
    res.json = function(data: any) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Log successful operations
      if (res.statusCode >= 200 && res.statusCode < 300) {
        logAuditTrail(req, entityType, data, {
          ...options,
          duration,
          success: true
        }).catch(err => {
          safeLog.error('Audit logging failed:', err);
        });
      } 
      // Log failures if enabled
      else if (options.logFailures && res.statusCode >= 400) {
        logAuditTrail(req, entityType, data, {
          ...options,
          duration,
          success: false,
          statusCode: res.statusCode
        }).catch(err => {
          safeLog.error('Audit logging failed:', err);
        });
      }
      
      return originalJson.call(this, data);
    };
    
    next();
  };
};

async function logAuditTrail(
  req: AuthRequest, 
  entityType: string, 
  responseData: any, 
  options: {
    duration?: number;
    success?: boolean;
    statusCode?: number;
    logFailures?: boolean;
    logSensitiveOperations?: boolean;
    includeRequestBody?: boolean;
  } = {}
) {
  try {
    const action = getActionFromMethod(req.method);
    const entityId = req.params.id || responseData?.data?.id || responseData?.id;
    const userId = req.user?.id;
    const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    
    // Enhanced audit data
    const changes = {
      method: req.method,
      url: req.originalUrl,
      body: options.includeRequestBody && req.method !== 'GET' ? req.body : undefined,
      query: req.query,
      userAgent: req.get('User-Agent'),
      duration: options.duration,
      success: options.success,
      statusCode: options.statusCode,
      timestamp: new Date().toISOString(),
      userRole: req.user?.role,
      // Include response data for sensitive operations
      responseData: options.logSensitiveOperations ? responseData : undefined
    };

    // Log to audit_logs table
    await query(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, changes, ip_address)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [userId, action, entityType, entityId, JSON.stringify(changes), ipAddress]);

    // Log security events for sensitive operations
    if (options.logSensitiveOperations || isSensitiveOperation(action, entityType)) {
      await logSecurityEvent(req, action, entityType, entityId, options);
    }

    safeLog.info('Audit logged', { 
      userId, 
      action, 
      entityType, 
      entityId,
      duration: options.duration,
      success: options.success
    });
  } catch (error) {
    safeLog.error('Audit trail error:', error);
  }
}

/**
 * Log security events for sensitive operations
 */
async function logSecurityEvent(
  req: AuthRequest,
  action: string,
  entityType: string,
  entityId: string | undefined,
  options: any
) {
  try {
    const eventType = `AUDIT_${action}_${entityType.toUpperCase()}`;
    const severity = getSeverityForOperation(action, entityType);
    const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    const userAgent = req.get('User-Agent');
    
    await query(`
      INSERT INTO security_events (event_type, user_id, ip_address, user_agent, details, severity)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      eventType,
      req.user?.id || null,
      ipAddress,
      userAgent,
      JSON.stringify({
        action,
        entity_type: entityType,
        entity_id: entityId,
        duration: options.duration,
        success: options.success,
        status_code: options.statusCode,
        user_role: req.user?.role,
        timestamp: new Date().toISOString()
      }),
      severity
    ]);
  } catch (error) {
    safeLog.error('Security event logging failed:', error);
  }
}

/**
 * Determine if an operation is sensitive and requires security logging
 */
function isSensitiveOperation(action: string, entityType: string): boolean {
  const sensitiveActions = ['DELETE', 'FINALIZE'];
  const sensitiveEntities = ['user', 'company', 'audit_log'];
  
  return sensitiveActions.includes(action) || sensitiveEntities.includes(entityType.toLowerCase());
}

/**
 * Get severity level for different operations
 */
function getSeverityForOperation(action: string, entityType: string): 'low' | 'medium' | 'high' | 'critical' {
  if (action === 'DELETE' && entityType === 'user') return 'high';
  if (action === 'DELETE') return 'medium';
  if (action === 'FINALIZE') return 'medium';
  if (action === 'CREATE' && entityType === 'user') return 'medium';
  return 'low';
}

function getActionFromMethod(method: string): string {
  switch (method) {
    case 'POST': return 'CREATE';
    case 'PUT':
    case 'PATCH': return 'UPDATE';
    case 'DELETE': return 'DELETE';
    case 'GET': return 'READ';
    default: return method;
  }
}