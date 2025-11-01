# API Consolidation and Standardization Design

## Overview

This design document outlines the comprehensive refactoring of the CRM application's API architecture to address route inconsistencies, middleware implementation gaps, response format standardization, and error handling improvements.

## Architecture

### API Versioning Strategy

```
Current State:
/api/auth/login          (legacy)
/api/v1/companies        (v1)
/api/companies           (legacy duplicate)

Target State:
/api/v1/auth/login       (standardized)
/api/v1/companies        (standardized)
/api/* → /api/v1/*       (redirect legacy)
```

### Middleware Chain Architecture

```
Request → Security → Auth → Role → Validation → Route Handler → Response
```

1. **Security Middleware**: Rate limiting, CORS, security headers
2. **Authentication**: JWT token verification
3. **Role-based Access**: Permission checking based on user role
4. **Request Validation**: Zod schema validation
5. **Route Handler**: Business logic execution
6. **Response Formatting**: Standardized response wrapper

## Components and Interfaces

### 1. Standardized Response Interface

```typescript
interface ApiResponse<T> {
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
}
```

### 2. Enhanced Middleware System

#### Role-based Access Control
```typescript
interface RoleMiddleware {
  enforceReadOnly: (req: AuthRequest, res: Response, next: NextFunction) => void;
  preventFinalizedEdit: (req: AuthRequest, res: Response, next: NextFunction) => void;
  requireFinalizers: (req: AuthRequest, res: Response, next: NextFunction) => void;
}
```

#### Request Validation
```typescript
interface ValidationMiddleware {
  validateRequest: (schema: ZodSchema) => RequestHandler;
  validateQuery: (schema: ZodSchema) => RequestHandler;
}
```

### 3. Error Handling System

#### Backend Error Handler
```typescript
interface ErrorHandler {
  asyncHandler: (fn: Function) => RequestHandler;
  globalErrorHandler: (err: Error, req: Request, res: Response, next: NextFunction) => void;
  notFoundHandler: (req: Request, res: Response) => void;
}
```

#### Frontend Error Boundary
```typescript
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}
```

## Data Models

### Route Configuration
```typescript
interface RouteConfig {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  middleware: RequestHandler[];
  handler: RequestHandler;
  validation?: {
    body?: ZodSchema;
    query?: ZodSchema;
    params?: ZodSchema;
  };
}
```

### Error Response Model
```typescript
interface ErrorResponse {
  success: false;
  error: string;
  details?: ValidationError[];
  timestamp: string;
  requestId?: string;
}
```

## Error Handling

### Backend Error Categories
1. **Validation Errors** (400): Invalid request data
2. **Authentication Errors** (401): Missing or invalid tokens
3. **Authorization Errors** (403): Insufficient permissions
4. **Not Found Errors** (404): Resource not found
5. **Server Errors** (500): Internal server errors

### Frontend Error Handling
1. **Global Error Boundary**: Catches React component errors
2. **API Error Handler**: Processes API response errors
3. **Toast Notifications**: User-friendly error messages
4. **Retry Mechanisms**: Automatic retry for transient errors

## Testing Strategy

### Backend Testing
1. **Route Testing**: Verify all endpoints return standardized responses
2. **Middleware Testing**: Test role-based access control and validation
3. **Error Handling Testing**: Verify proper error responses and logging
4. **Integration Testing**: End-to-end API workflow testing

### Frontend Testing
1. **Error Boundary Testing**: Verify error catching and display
2. **API Client Testing**: Test standardized response handling
3. **User Experience Testing**: Verify error message clarity
4. **Retry Logic Testing**: Test automatic retry mechanisms

## Implementation Plan

### Phase 1: Backend Consolidation
1. Consolidate routes to `/api/v1` standard
2. Remove duplicate route definitions
3. Implement proper middleware chain
4. Standardize response formats

### Phase 2: Frontend Updates
1. Update API client for standardized responses
2. Implement global error boundary
3. Update error handling throughout components
4. Add retry mechanisms

### Phase 3: Testing and Validation
1. Comprehensive testing of all endpoints
2. Error scenario testing
3. Performance impact assessment
4. Documentation updates

## Migration Strategy

### Backward Compatibility
- Legacy `/api` routes will redirect to `/api/v1`
- Gradual migration approach to minimize disruption
- Deprecation warnings for legacy endpoints
- Timeline for legacy route removal

### Rollback Plan
- Feature flags for new error handling
- Database rollback scripts if needed
- Quick revert to legacy routes if issues arise
- Monitoring and alerting for migration issues