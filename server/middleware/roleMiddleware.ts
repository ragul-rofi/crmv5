import { Response, NextFunction } from 'express';
import { AuthRequest } from '../auth.js';
import { UserRole, hasPermission, isInRoleGroup, ROLE_GROUPS, getPermissions } from '../utils/roles.js';
import { sendError } from '../utils/standardResponse.js';
import { query } from '../db.js';
import { safeLog } from '../utils/logger.js';

/**
 * Enhanced user context validation
 */
export const validateUserContext = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    await logSecurityEvent('UNAUTHORIZED_ACCESS', null, req, 'medium', {
      path: req.path,
      method: req.method,
      reason: 'No user context'
    });
    return sendError(res, 'Unauthorized: No user context', 401);
  }

  try {
    // Validate user still exists and is active
    const userResult = await query(
      'SELECT id, email, role, is_active, locked_until FROM users WHERE id = $1',
      [req.user.id]
    );

    if (!userResult.rows[0]) {
      await logSecurityEvent('INVALID_USER_TOKEN', req.user.id, req, 'high', {
        reason: 'User not found in database'
      });
      return sendError(res, 'Unauthorized: Invalid user token', 401);
    }

    const user = userResult.rows[0];

    // Check if user is active
    if (!user.is_active) {
      await logSecurityEvent('INACTIVE_USER_ACCESS', req.user.id, req, 'medium', {
        reason: 'User account is inactive'
      });
      return sendError(res, 'Unauthorized: Account is inactive', 401);
    }

    // Check if user is locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      await logSecurityEvent('LOCKED_USER_ACCESS', req.user.id, req, 'medium', {
        reason: 'User account is locked',
        locked_until: user.locked_until
      });
      return sendError(res, 'Unauthorized: Account is locked', 401);
    }

    // Validate role consistency
    if (user.role !== req.user.role) {
      await logSecurityEvent('ROLE_MISMATCH', req.user.id, req, 'high', {
        token_role: req.user.role,
        db_role: user.role
      });
      return sendError(res, 'Unauthorized: Role mismatch detected', 401);
    }

    // Update user context with fresh data
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    next();
  } catch (error) {
    safeLog.error('User context validation error:', error);
    await logSecurityEvent('USER_VALIDATION_ERROR', req.user?.id || null, req, 'high', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return sendError(res, 'Internal server error during authentication', 500);
  }
};

/**
 * Comprehensive permission checking middleware
 * @param permission - Specific permission to check
 * @param options - Additional options for permission checking
 */
export const requirePermission = (
  permission: keyof import('../utils/roles.js').RolePermissions,
  options: {
    logAccess?: boolean;
    allowSelfAccess?: boolean;
    entityType?: string;
  } = {}
) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      await logSecurityEvent('PERMISSION_CHECK_NO_USER', null, req, 'medium', {
        permission,
        path: req.path
      });
      return sendError(res, 'Unauthorized: No user context', 401);
    }

    const userPermissions = getPermissions(req.user.role as UserRole);
    const hasRequiredPermission = userPermissions[permission];

    // Handle self-access scenarios (e.g., user updating their own profile)
    if (!hasRequiredPermission && options.allowSelfAccess) {
      const resourceUserId = req.params.userId || req.params.id;
      if (resourceUserId === req.user.id) {
        if (options.logAccess) {
          await logSecurityEvent('SELF_ACCESS_GRANTED', req.user.id, req, 'low', {
            permission,
            resource_id: resourceUserId
          });
        }
        return next();
      }
    }

    if (!hasRequiredPermission) {
      await logSecurityEvent('PERMISSION_DENIED', req.user.id, req, 'medium', {
        permission,
        user_role: req.user.role,
        path: req.path,
        method: req.method,
        entity_type: options.entityType
      });
      return sendError(res, `Forbidden: Insufficient permissions (${permission})`, 403, {
        required_permission: permission,
        user_role: req.user.role
      });
    }

    // Log successful permission grants for sensitive operations
    if (options.logAccess) {
      await logSecurityEvent('PERMISSION_GRANTED', req.user.id, req, 'low', {
        permission,
        user_role: req.user.role,
        entity_type: options.entityType
      });
    }

    next();
  };
};

/**
 * Middleware to restrict access based on user roles
 * @param allowedRoles - Array of role names that are allowed to access the route
 */
export const requireRole = (...allowedRoles: UserRole[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      await logSecurityEvent('ROLE_CHECK_NO_USER', null, req, 'medium', {
        required_roles: allowedRoles,
        path: req.path
      });
      return sendError(res, 'Unauthorized: No user context', 401);
    }
    
    if (!allowedRoles.includes(req.user.role as UserRole)) {
      await logSecurityEvent('ROLE_ACCESS_DENIED', req.user.id, req, 'medium', {
        required_roles: allowedRoles,
        user_role: req.user.role,
        path: req.path,
        method: req.method
      });
      return sendError(res, 'Forbidden: Insufficient permissions', 403, {
        required: allowedRoles,
        current: req.user.role
      });
    }
    
    next();
  };
};

// Predefined role combinations using centralized ROLE_GROUPS
export const requireManagers = requireRole(...ROLE_GROUPS.MANAGERS);
export const requireManager = requireRole(...ROLE_GROUPS.MANAGERS);
export const requireAdmin = requireRole('Admin');
export const requireTaskAssigners = requireRole(...ROLE_GROUPS.TASK_ASSIGNERS);
export const requireFinalizers = requireRole(...ROLE_GROUPS.FINALIZERS);
export const requireUserManagers = requireRole(...ROLE_GROUPS.USER_MANAGERS);
export const requireCustomFieldManagers = requireRole(...ROLE_GROUPS.CUSTOM_FIELD_MANAGERS);
export const requireReadOnlyWithComments = requireRole(...ROLE_GROUPS.READ_ONLY_WITH_COMMENTS);

/**
 * Enhanced middleware to enforce read-only access for specific roles
 * Blocks POST, PUT, PATCH, DELETE methods for roles without edit permissions
 */
export const enforceReadOnly = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const modifyingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  
  if (!req.user) {
    await logSecurityEvent('READ_ONLY_CHECK_NO_USER', null, req, 'medium', {
      method: req.method,
      path: req.path
    });
    return sendError(res, 'Unauthorized: No user context', 401);
  }
  
  const role = req.user.role as UserRole;
  const permissions = getPermissions(role);
  
  // Check if this is a modifying request and user doesn't have edit permission
  if (modifyingMethods.includes(req.method)) {
    let hasModifyPermission = false;
    
    // Check specific permissions based on method
    switch (req.method) {
      case 'POST':
        hasModifyPermission = permissions.canCreate;
        break;
      case 'PUT':
      case 'PATCH':
        hasModifyPermission = permissions.canEdit;
        break;
      case 'DELETE':
        hasModifyPermission = permissions.canDelete;
        break;
    }
    
    // Special cases for specific roles and paths
    if (!hasModifyPermission) {
      // DataCollectors can create, edit, and delete company data (their primary job)
      if (role === 'DataCollector' && req.path.includes('/companies')) {
        hasModifyPermission = true;
      }
      
      // Task workers (Converters) can update their own tasks
      if (isInRoleGroup(role, ROLE_GROUPS.TASK_WORKERS) && req.path.includes('/tasks/')) {
        hasModifyPermission = true; // Will be further validated in task-specific middleware
      }
    }
    
    if (!hasModifyPermission) {
      await logSecurityEvent('READ_ONLY_VIOLATION', req.user.id, req, 'medium', {
        method: req.method,
        path: req.path,
        user_role: role,
        attempted_action: req.method
      });
      return sendError(res, 'Read-only access: Your role cannot modify data', 403, {
        role: req.user.role,
        method: req.method
      });
    }
  }
  
  next();
};

/**
 * Enhanced middleware to check if user can update a specific task
 * DataCollectors and Converters can only update tasks assigned to them
 */
export const enforceTaskUpdatePermission = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    await logSecurityEvent('TASK_UPDATE_NO_USER', null, req, 'medium', {
      task_id: req.params.id,
      path: req.path
    });
    return sendError(res, 'Unauthorized: No user context', 401);
  }
  
  const role = req.user.role as UserRole;
  const permissions = getPermissions(role);
  
  // Managers and admins can update any task
  if (permissions.canUpdateAllTasks) {
    await logSecurityEvent('TASK_UPDATE_ADMIN_ACCESS', req.user.id, req, 'low', {
      task_id: req.params.id,
      user_role: role
    });
    return next();
  }
  
  // Task workers can only update their own tasks - will be validated in route handler
  if (permissions.canUpdateOwnTasks) {
    req.mustBeAssignedUser = true; // Flag for route handler to check
    await logSecurityEvent('TASK_UPDATE_OWN_ACCESS', req.user.id, req, 'low', {
      task_id: req.params.id,
      user_role: role,
      requires_assignment_check: true
    });
    return next();
  }
  
  await logSecurityEvent('TASK_UPDATE_DENIED', req.user.id, req, 'medium', {
    task_id: req.params.id,
    user_role: role,
    reason: 'No task update permissions'
  });
  return sendError(res, 'Forbidden: You do not have permission to update tasks', 403, { role });
};

/**
 * Enhanced middleware to prevent editing finalized data
 */
export const preventFinalizedEdit = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    await logSecurityEvent('FINALIZED_EDIT_NO_USER', null, req, 'medium', {
      company_id: req.params.id,
      method: req.method
    });
    return sendError(res, 'Unauthorized: No user context', 401);
  }
  
  const role = req.user.role as UserRole;
  const permissions = getPermissions(role);
  
  // Only users with canEditFinalized permission can edit finalized data
  if (permissions.canEditFinalized) {
    await logSecurityEvent('FINALIZED_EDIT_ADMIN_ACCESS', req.user.id, req, 'low', {
      company_id: req.params.id,
      user_role: role,
      method: req.method
    });
    return next();
  }
  
  // Check if the company being edited is finalized
  const companyId = req.params.id;
  if (companyId && (req.method === 'PUT' || req.method === 'PATCH' || req.method === 'DELETE')) {
    try {
      const result = await query(
        'SELECT finalization_status, finalized_by_id, finalized_at FROM companies WHERE id = $1',
        [companyId]
      );
      
      if (result.rows[0]?.finalization_status === 'Finalized') {
        await logSecurityEvent('FINALIZED_EDIT_ATTEMPT', req.user.id, req, 'high', {
          company_id: companyId,
          user_role: role,
          method: req.method,
          finalized_by: result.rows[0].finalized_by_id,
          finalized_at: result.rows[0].finalized_at
        });
        return sendError(res, 'Cannot modify finalized company data', 403, {
          details: 'This company has been finalized and cannot be edited',
          finalized_at: result.rows[0].finalized_at
        });
      }
    } catch (error) {
      safeLog.error('Error checking finalization status:', error);
      await logSecurityEvent('FINALIZED_EDIT_CHECK_ERROR', req.user.id, req, 'high', {
        company_id: companyId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return sendError(res, 'Internal server error', 500);
    }
  }
  
  next();
};

/**
 * Log security events to the security_events table
 */
async function logSecurityEvent(
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
 * Middleware to check resource ownership
 * Ensures users can only access resources they own or have permission to access
 */
export const enforceResourceOwnership = (
  resourceType: 'task' | 'ticket' | 'company',
  options: {
    allowManagers?: boolean;
    userIdField?: string;
    assignedToField?: string;
  } = {}
) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      await logSecurityEvent('RESOURCE_OWNERSHIP_NO_USER', null, req, 'medium', {
        resource_type: resourceType,
        resource_id: req.params.id
      });
      return sendError(res, 'Unauthorized: No user context', 401);
    }

    const role = req.user.role as UserRole;
    const permissions = getPermissions(role);
    const resourceId = req.params.id;

    // Managers and admins can access all resources
    if (options.allowManagers && (permissions.canUpdateAllTasks || isInRoleGroup(role, ROLE_GROUPS.MANAGERS))) {
      return next();
    }

    try {
      let tableName: string;
      let ownershipField: string;

      switch (resourceType) {
        case 'task':
          tableName = 'tasks';
          ownershipField = options.assignedToField || 'assigned_to_id';
          break;
        case 'ticket':
          tableName = 'tickets';
          ownershipField = options.assignedToField || 'assigned_to_id';
          break;
        case 'company':
          tableName = 'companies';
          ownershipField = options.assignedToField || 'assigned_data_collector_id';
          break;
        default:
          throw new Error(`Unsupported resource type: ${resourceType}`);
      }

      const result = await query(
        `SELECT ${ownershipField}, raised_by_id FROM ${tableName} WHERE id = $1`,
        [resourceId]
      );

      if (!result.rows[0]) {
        await logSecurityEvent('RESOURCE_NOT_FOUND', req.user.id, req, 'medium', {
          resource_type: resourceType,
          resource_id: resourceId
        });
        return sendError(res, `${resourceType} not found`, 404);
      }

      const resource = result.rows[0];
      const isOwner = resource[ownershipField] === req.user.id;
      const isRaiser = resource.raised_by_id === req.user.id;

      if (!isOwner && !isRaiser) {
        await logSecurityEvent('RESOURCE_OWNERSHIP_VIOLATION', req.user.id, req, 'medium', {
          resource_type: resourceType,
          resource_id: resourceId,
          user_role: role,
          owner_id: resource[ownershipField],
          raiser_id: resource.raised_by_id
        });
        return sendError(res, `Forbidden: You can only access your own ${resourceType}s`, 403);
      }

      next();
    } catch (error) {
      safeLog.error(`Resource ownership check error for ${resourceType}:`, error);
      await logSecurityEvent('RESOURCE_OWNERSHIP_ERROR', req.user.id, req, 'high', {
        resource_type: resourceType,
        resource_id: resourceId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return sendError(res, 'Internal server error', 500);
    }
  };
};

/**
 * Middleware to enforce bulk operation limits
 */
export const enforceBulkOperationLimits = (maxItems: number = 100) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      await logSecurityEvent('BULK_OPERATION_NO_USER', null, req, 'medium', {
        max_items: maxItems
      });
      return sendError(res, 'Unauthorized: No user context', 401);
    }

    const role = req.user.role as UserRole;
    const permissions = getPermissions(role);

    // Check if user has bulk operation permissions
    if (!permissions.canBulkDelete && req.method === 'DELETE') {
      await logSecurityEvent('BULK_OPERATION_DENIED', req.user.id, req, 'medium', {
        operation: 'bulk_delete',
        user_role: role
      });
      return sendError(res, 'Forbidden: Bulk delete not allowed for your role', 403);
    }

    // Check bulk operation limits
    const itemIds = req.body.ids || [];
    if (Array.isArray(itemIds) && itemIds.length > maxItems) {
      await logSecurityEvent('BULK_OPERATION_LIMIT_EXCEEDED', req.user.id, req, 'medium', {
        requested_items: itemIds.length,
        max_allowed: maxItems,
        user_role: role
      });
      return sendError(res, `Bulk operation limit exceeded. Maximum ${maxItems} items allowed`, 400, {
        requested: itemIds.length,
        maximum: maxItems
      });
    }

    next();
  };
};

/**
 * Middleware to log sensitive operations
 */
export const logSensitiveOperation = (operationType: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next();
    }

    await logSecurityEvent('SENSITIVE_OPERATION', req.user.id, req, 'low', {
      operation_type: operationType,
      user_role: req.user.role,
      resource_id: req.params.id,
      request_body_keys: req.body ? Object.keys(req.body) : []
    });

    next();
  };
};

// Extend AuthRequest interface
declare module '../auth.js' {
  interface AuthRequest {
    mustBeAssignedUser?: boolean;
    preventFinalizedEdit?: boolean;
  }
}
