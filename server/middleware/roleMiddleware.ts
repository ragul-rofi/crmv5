import { Response, NextFunction } from 'express';
import { AuthRequest } from '../auth.js';
import { UserRole, hasPermission, isInRoleGroup, ROLE_GROUPS } from '../utils/roles.js';

/**
 * Middleware to restrict access based on user roles
 * @param allowedRoles - Array of role names that are allowed to access the route
 */
export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: No user context' });
    }
    
    if (!allowedRoles.includes(req.user.role as UserRole)) {
      return res.status(403).json({ 
        error: 'Forbidden: Insufficient permissions',
        required: allowedRoles,
        current: req.user.role
      });
    }
    
    next();
  };
};

// Predefined role combinations using centralized ROLE_GROUPS
export const requireManager = requireRole(...ROLE_GROUPS.MANAGERS);
export const requireAdmin = requireRole('Admin');
export const requireTaskAssigners = requireRole(...ROLE_GROUPS.TASK_ASSIGNERS);
export const requireFinalizers = requireRole(...ROLE_GROUPS.FINALIZERS);
export const requireUserManagers = requireRole(...ROLE_GROUPS.USER_MANAGERS);
export const requireCustomFieldManagers = requireRole(...ROLE_GROUPS.CUSTOM_FIELD_MANAGERS);
export const requireReadOnlyWithComments = requireRole(...ROLE_GROUPS.READ_ONLY_WITH_COMMENTS);

/**
 * Middleware to enforce read-only access for specific roles
 * Blocks POST, PUT, PATCH, DELETE methods for roles without edit permissions
 */
export const enforceReadOnly = (req: AuthRequest, res: Response, next: NextFunction) => {
  const modifyingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized: No user context' });
  }
  
  const role = req.user.role as UserRole;
  
  // Check if this is a modifying request and user doesn't have edit permission
  if (modifyingMethods.includes(req.method)) {
    // DataCollectors can create, edit, and delete company data (their primary job)
    if (role === 'DataCollector') {
      return next();
    }
    
    // Task workers (Converters) can update their own tasks
    if (isInRoleGroup(role, ROLE_GROUPS.TASK_WORKERS) && req.path.includes('/tasks/')) {
      return next();
    }
    
    if (!hasPermission(role, 'canEdit') && !hasPermission(role, 'canCreate') && !hasPermission(role, 'canDelete')) {
      return res.status(403).json({ 
        error: 'Read-only access: Your role cannot modify data',
        role: req.user.role
      });
    }
  }
  
  next();
};

/**
 * Middleware to check if user can update a specific task
 * DataCollectors and Converters can only update tasks assigned to them
 */
export const enforceTaskUpdatePermission = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized: No user context' });
  }
  
  const role = req.user.role as UserRole;
  
  // Managers and admins can update any task
  if (hasPermission(role, 'canUpdateAllTasks')) {
    return next();
  }
  
  // Task workers can only update their own tasks - will be validated in route handler
  if (hasPermission(role, 'canUpdateOwnTasks')) {
    req.mustBeAssignedUser = true; // Flag for route handler to check
    return next();
  }
  
  return res.status(403).json({ 
    error: 'Forbidden: You do not have permission to update tasks',
    role
  });
};

/**
 * Middleware to prevent editing finalized data
 */
export const preventFinalizedEdit = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized: No user context' });
  }
  
  const role = req.user.role as UserRole;
  
  // Only Admin can edit finalized data
  if (hasPermission(role, 'canEditFinalized')) {
    return next();
  }
  
  // Will need to check in route handler if data is finalized
  req.preventFinalizedEdit = true;
  next();
};

// Extend AuthRequest interface
declare module '../auth.js' {
  interface AuthRequest {
    mustBeAssignedUser?: boolean;
    preventFinalizedEdit?: boolean;
  }
}
