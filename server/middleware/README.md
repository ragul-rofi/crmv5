# Enhanced Role-Based Access Control Middleware

This document describes the comprehensive role-based access control middleware system that provides enhanced security, user context validation, and audit logging.

## Overview

The enhanced middleware system provides:

1. **Comprehensive Permission Checking** - Fine-grained permission validation based on user roles
2. **User Context Validation** - Real-time validation of user sessions and account status
3. **Security Event Logging** - Comprehensive logging of security-related events
4. **Suspicious Activity Detection** - Automated detection of potential security threats
5. **Resource Ownership Enforcement** - Ensures users can only access resources they own or have permission to access

## Core Middleware Components

### 1. Role-Based Access Control (`roleMiddleware.ts`)

#### `validateUserContext()`
Validates user context and ensures the user is still active and authorized:
- Checks if user exists in database
- Validates account is active and not locked
- Verifies role consistency between token and database
- Logs security events for invalid access attempts

#### `requirePermission(permission, options)`
Checks specific permissions based on user role:
- Validates fine-grained permissions (canEdit, canDelete, etc.)
- Supports self-access scenarios
- Logs permission grants/denials
- Returns detailed error messages

#### `requireRole(...roles)`
Restricts access to specific roles:
- Enhanced logging of access attempts
- Detailed error reporting
- Security event logging for unauthorized access

#### `enforceReadOnly()`
Prevents data modification for read-only roles:
- Method-based permission checking (POST, PUT, DELETE)
- Special handling for DataCollectors and task workers
- Comprehensive logging of read-only violations

#### `enforceResourceOwnership(resourceType, options)`
Ensures users can only access resources they own:
- Supports tasks, tickets, and companies
- Manager override capabilities
- Detailed ownership validation logging

#### `enforceBulkOperationLimits(maxItems)`
Limits bulk operations to prevent abuse:
- Configurable item limits
- Role-based bulk operation permissions
- Security logging for limit violations

### 2. Security Middleware (`securityMiddleware.ts`)

#### `SecurityMiddleware.rateLimitByUser(maxRequests, windowMs)`
Per-user rate limiting:
- Prevents API abuse
- Configurable limits per user
- Automatic cleanup of old data

#### `SecurityMiddleware.detectSuspiciousActivity()`
Detects suspicious behavior patterns:
- Multiple permission violations
- Rapid sequential requests
- Access to unauthorized endpoints
- Escalating security alerts

#### `SecurityMiddleware.validateRequestIntegrity()`
Validates request data for malicious content:
- XSS pattern detection
- SQL injection prevention
- Request tampering detection

#### `SecurityMiddleware.validateSession()`
Enhanced session validation:
- Database-backed session verification
- Session expiration checking
- Session hijacking prevention

### 3. Enhanced Audit Middleware (`audit.ts`)

#### `auditMiddleware(entityType, options)`
Comprehensive audit logging:
- Success and failure logging
- Performance metrics (request duration)
- Sensitive operation detection
- Security event correlation

## Security Event Types

The system logs various security events to the `security_events` table:

### Authentication Events
- `UNAUTHORIZED_ACCESS` - No user context provided
- `INVALID_USER_TOKEN` - Token references non-existent user
- `INACTIVE_USER_ACCESS` - Inactive user attempting access
- `LOCKED_USER_ACCESS` - Locked user attempting access
- `ROLE_MISMATCH` - Token role doesn't match database role

### Permission Events
- `PERMISSION_DENIED` - Insufficient permissions for operation
- `PERMISSION_GRANTED` - Successful permission grant (for sensitive ops)
- `ROLE_ACCESS_DENIED` - Role-based access denied
- `READ_ONLY_VIOLATION` - Attempt to modify data with read-only role

### Resource Access Events
- `RESOURCE_OWNERSHIP_VIOLATION` - Access to non-owned resource
- `FINALIZED_EDIT_ATTEMPT` - Attempt to edit finalized data
- `TASK_UPDATE_DENIED` - Unauthorized task update attempt

### Security Threat Events
- `SUSPICIOUS_ACTIVITY_DETECTED` - Pattern of suspicious behavior
- `POTENTIAL_SECURITY_THREAT` - High-risk activity detected
- `MALICIOUS_REQUEST_DETECTED` - Request contains malicious patterns
- `RATE_LIMIT_EXCEEDED` - User exceeded rate limits

### System Events
- `SESSION_VALIDATION_ERROR` - Session validation failure
- `USER_VALIDATION_ERROR` - User context validation error
- `BULK_OPERATION_LIMIT_EXCEEDED` - Bulk operation limits exceeded

## Usage Examples

### Basic Authentication and Authorization
```typescript
import { createStandardAuth } from '../middleware/index.js';

router.get('/protected', createStandardAuth(), (req, res) => {
  // Route handler
});
```

### Admin-Only Operations
```typescript
import { createAdminOnly } from '../middleware/index.js';

router.delete('/users/:id', createAdminOnly(), (req, res) => {
  // Admin-only route handler
});
```

### Resource-Specific Operations
```typescript
import { createTaskOperations } from '../middleware/index.js';

router.put('/tasks/:id', createTaskOperations(), (req, res) => {
  // Task update with ownership validation
});
```

### Custom Permission Checking
```typescript
import { requirePermission, auditMiddleware } from '../middleware/index.js';

router.post('/companies', 
  requirePermission('canCreate', { logAccess: true }),
  auditMiddleware('company', { logSensitiveOperations: true }),
  (req, res) => {
    // Company creation handler
  }
);
```

### Bulk Operations
```typescript
import { createBulkOperations } from '../middleware/index.js';

router.delete('/companies/bulk', createBulkOperations(25), (req, res) => {
  // Bulk delete with 25 item limit
});
```

## Configuration

### Environment Variables
- `JWT_SECRET` - Required for token verification
- `NODE_ENV` - Affects error detail exposure
- `LOG_LEVEL` - Controls logging verbosity

### Database Tables Required
- `users` - User account information
- `user_sessions` - Active user sessions
- `security_events` - Security event logging
- `audit_logs` - Audit trail logging

### Customization Options

#### Rate Limiting
```typescript
SecurityMiddleware.rateLimitByUser(200, 300000) // 200 requests per 5 minutes
```

#### Bulk Operation Limits
```typescript
enforceBulkOperationLimits(100) // Maximum 100 items per bulk operation
```

#### Audit Logging Options
```typescript
auditMiddleware('company', {
  logFailures: true,
  logSensitiveOperations: true,
  includeRequestBody: true
})
```

## Security Best Practices

1. **Always use `validateUserContext`** for authenticated routes
2. **Log sensitive operations** using `logSensitiveOperation`
3. **Implement resource ownership** for user-specific data
4. **Use bulk operation limits** to prevent abuse
5. **Monitor security events** regularly for threats
6. **Implement rate limiting** on public endpoints
7. **Validate request integrity** for sensitive operations

## Monitoring and Alerting

The system provides comprehensive logging that can be used for:

- **Real-time threat detection** - Monitor for `POTENTIAL_SECURITY_THREAT` events
- **Performance monitoring** - Track request durations in audit logs
- **Access pattern analysis** - Analyze permission grants/denials
- **Compliance reporting** - Generate audit reports from logged events

## Troubleshooting

### Common Issues

1. **High security event volume** - May indicate misconfigured permissions
2. **Rate limit violations** - Check for legitimate high-usage scenarios
3. **Session validation failures** - Verify database connectivity and session table
4. **Permission denied errors** - Review role permissions configuration

### Debug Logging

Enable debug logging by setting `LOG_LEVEL=debug` to see detailed middleware execution information.