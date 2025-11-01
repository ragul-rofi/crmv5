/**
 * Enhanced Middleware Index
 * Exports all middleware with comprehensive role-based access control,
 * user context validation, and security event logging
 */

// Authentication and authorization
export { verifyToken, generateToken } from '../auth.js';

// Enhanced role-based access control
export {
  validateUserContext,
  requirePermission,
  requireRole,
  requireManagers,
  requireManager,
  requireAdmin,
  requireTaskAssigners,
  requireFinalizers,
  requireUserManagers,
  requireCustomFieldManagers,
  requireReadOnlyWithComments,
  enforceReadOnly,
  enforceTaskUpdatePermission,
  preventFinalizedEdit,
  enforceResourceOwnership,
  enforceBulkOperationLimits,
  logSensitiveOperation
} from './roleMiddleware.js';

// Enhanced audit logging
export { auditMiddleware } from './audit.js';

// Comprehensive security middleware
export { SecurityMiddleware } from './securityMiddleware.js';

// Request validation middleware
export { validateRequest, validateQuery, validateParams, validate } from './validation.js';

// Other existing middleware
export { responseCompression, cacheHeaders } from './compression.js';
export { errorHandler, createError, asyncHandler } from './errorHandler.js';
export { requestLogger } from './requestLogger.js';

/**
 * Middleware composition helpers
 */

/**
 * Middleware composition helpers
 * Import the middleware functions dynamically to avoid circular dependencies
 */
import * as auth from '../auth.js';
import * as roleMiddleware from './roleMiddleware.js';
import * as securityMiddleware from './securityMiddleware.js';

/**
 * Standard authentication and authorization chain
 */
export const createStandardAuth = () => [
  auth.verifyToken,
  roleMiddleware.validateUserContext
];

/**
 * Enhanced security chain for sensitive operations
 */
export const createEnhancedSecurity = () => [
  auth.verifyToken,
  roleMiddleware.validateUserContext,
  securityMiddleware.SecurityMiddleware.validateSession(),
  securityMiddleware.SecurityMiddleware.detectSuspiciousActivity(),
  securityMiddleware.SecurityMiddleware.validateRequestIntegrity()
];

/**
 * Admin-only operations with full security
 */
export const createAdminOnly = () => [
  ...createEnhancedSecurity(),
  roleMiddleware.requireAdmin,
  roleMiddleware.logSensitiveOperation('admin_operation')
];

/**
 * Manager-level operations with enhanced logging
 */
export const createManagerLevel = () => [
  ...createStandardAuth(),
  roleMiddleware.requireManagers,
  roleMiddleware.logSensitiveOperation('manager_operation')
];

/**
 * Data modification operations with finalization checks
 */
export const createDataModification = () => [
  ...createStandardAuth(),
  roleMiddleware.enforceReadOnly,
  roleMiddleware.preventFinalizedEdit
];

/**
 * Bulk operations with limits and logging
 */
export const createBulkOperations = (maxItems: number = 50) => [
  ...createEnhancedSecurity(),
  roleMiddleware.enforceBulkOperationLimits(maxItems),
  roleMiddleware.logSensitiveOperation('bulk_operation')
];

/**
 * Task-specific operations with ownership validation
 */
export const createTaskOperations = () => [
  ...createStandardAuth(),
  roleMiddleware.enforceTaskUpdatePermission,
  roleMiddleware.enforceResourceOwnership('task', { allowManagers: true })
];

/**
 * Company data operations with comprehensive checks
 */
export const createCompanyOperations = () => [
  ...createDataModification(),
  roleMiddleware.enforceResourceOwnership('company', { allowManagers: true })
];

/**
 * User management operations with high security
 */
export const createUserManagement = () => [
  ...createEnhancedSecurity(),
  roleMiddleware.requireUserManagers,
  roleMiddleware.logSensitiveOperation('user_management')
];