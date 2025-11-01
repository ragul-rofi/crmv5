# Request Validation Middleware

This document describes the comprehensive request validation middleware system that provides Zod schema validation, request sanitization, and error handling for all API endpoints.

## Overview

The validation middleware system provides:

1. **Request Body Validation** - Validates and sanitizes request body data using Zod schemas
2. **Query Parameter Validation** - Validates URL query parameters with type conversion
3. **URL Parameter Validation** - Validates URL path parameters (like `:id`)
4. **Request Sanitization** - Removes potential XSS patterns and malicious content
5. **Comprehensive Error Handling** - Returns standardized error responses with detailed validation messages

## Core Middleware Functions

### 1. `validateRequest(schema: ZodSchema)`

Validates request body against a Zod schema with automatic sanitization.

```typescript
import { validateRequest } from '../middleware/validation.js';
import { createUserSchema } from '../schemas/validation.js';

router.post('/users', validateRequest(createUserSchema), (req, res) => {
  // req.body is now validated and sanitized
  const { name, email } = req.body;
});
```

**Features:**
- Sanitizes input to remove XSS patterns
- Validates data structure and types
- Replaces req.body with validated data
- Returns 400 error with detailed field-level errors

### 2. `validateQuery(schema: ZodSchema)`

Validates URL query parameters with type conversion support.

```typescript
import { validateQuery } from '../middleware/validation.js';
import { paginationQuerySchema } from '../schemas/validation.js';

router.get('/users', validateQuery(paginationQuerySchema), (req, res) => {
  // req.query.page is now a number (if provided)
  const { page, limit, search } = req.query;
});
```

**Features:**
- Converts string query parameters to appropriate types
- Supports optional parameters
- Sanitizes query values
- Validates enum values and formats

### 3. `validateParams(schema: ZodSchema)`

Validates URL path parameters (like `:id`, `:userId`).

```typescript
import { validateParams } from '../middleware/validation.js';
import { uuidParamSchema } from '../schemas/validation.js';

router.get('/users/:id', validateParams(uuidParamSchema), (req, res) => {
  // req.params.id is validated as a UUID
  const { id } = req.params;
});
```

**Features:**
- Validates UUID format for ID parameters
- Sanitizes parameter values
- Ensures required parameters are present
- Validates enum values for specific parameters

### 4. `validate(schemas: { body?, query?, params? })`

Combined validation for multiple request parts in a single middleware.

```typescript
import { validate } from '../middleware/validation.js';

router.put('/users/:id', validate({
  params: uuidParamSchema,
  body: updateUserSchema,
  query: optionalQuerySchema
}), (req, res) => {
  // All parts are validated
});
```

## Request Sanitization

The middleware automatically sanitizes all string inputs to prevent XSS attacks:

### Removed Patterns:
- `<script>` tags and content
- `javascript:` protocols
- Event handlers (`onclick`, `onload`, etc.)
- Excessive whitespace

### Example:
```javascript
// Input
{ name: '<script>alert("xss")</script>John Doe' }

// After sanitization
{ name: 'John Doe' }
```

## Available Validation Schemas

### Authentication Schemas
- `loginSchema` - Email and password validation
- `signupSchema` - User registration with role validation

### Entity Schemas
- `createCompanySchema` / `updateCompanySchema` - Company data validation
- `createTaskSchema` / `updateTaskSchema` - Task data validation
- `createTicketSchema` / `updateTicketSchema` - Ticket data validation
- `createContactSchema` / `updateContactSchema` - Contact data validation

### Parameter Schemas
- `uuidParamSchema` - Validates `:id` as UUID
- `userIdParamSchema` - Validates `:userId` as UUID
- `companyIdParamSchema` - Validates `:companyId` as UUID

### Query Schemas
- `paginationQuerySchema` - Page, limit, search, sort parameters
- `companyQuerySchema` - Company-specific filters
- `taskQuerySchema` - Task-specific filters

### Admin Schemas
- `updateRolePermissionsSchema` - Role permission updates
- `updateSystemSettingSchema` - System setting updates
- `bulkApprovalActionSchema` - Bulk company approval actions

## Error Response Format

Validation errors return a standardized format:

```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Invalid email address",
      "code": "invalid_string"
    },
    {
      "field": "name",
      "message": "String must contain at least 1 character(s)",
      "code": "too_small"
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Usage Examples

### Basic Request Validation
```typescript
import { validateRequest } from '../middleware/validation.js';
import { createCompanySchema } from '../schemas/validation.js';

router.post('/companies', 
  verifyToken,
  validateRequest(createCompanySchema),
  companyController.create
);
```

### Parameter and Body Validation
```typescript
import { validateParams, validateRequest } from '../middleware/validation.js';
import { uuidParamSchema, updateCompanySchema } from '../schemas/validation.js';

router.put('/companies/:id',
  verifyToken,
  validateParams(uuidParamSchema),
  validateRequest(updateCompanySchema),
  companyController.update
);
```

### Query Parameter Validation
```typescript
import { validateQuery } from '../middleware/validation.js';
import { companyQuerySchema } from '../schemas/validation.js';

router.get('/companies',
  verifyToken,
  validateQuery(companyQuerySchema),
  companyController.getAll
);
```

### Combined Validation
```typescript
import { validate } from '../middleware/validation.js';

router.put('/companies/:id',
  verifyToken,
  validate({
    params: uuidParamSchema,
    body: updateCompanySchema,
    query: optionalFiltersSchema
  }),
  companyController.update
);
```

## Route Coverage

### Fully Validated Routes
- ✅ `/api/v1/auth/*` - Login, signup with credential validation
- ✅ `/api/v1/companies/*` - All CRUD operations with parameter validation
- ✅ `/api/v1/users/*` - User management with UUID parameter validation
- ✅ `/api/v1/tasks/*` - Task management with comprehensive validation
- ✅ `/api/v1/tickets/*` - Ticket system with validation
- ✅ `/api/v1/contacts/*` - Contact management with validation
- ✅ `/api/v1/comments/*` - Comment system with entity validation
- ✅ `/api/v1/notifications/*` - Notification management
- ✅ `/api/v1/follow-ups/*` - Follow-up tracking with validation
- ✅ `/api/v1/files/*` - File management with entity type validation
- ✅ `/api/v1/errors/*` - Error logging with structured validation
- ✅ `/api/v1/admin/*` - Admin operations with permission validation

## Security Features

### XSS Prevention
- Removes `<script>` tags and JavaScript protocols
- Sanitizes event handlers and malicious attributes
- Preserves legitimate content while removing threats

### Input Validation
- Type checking and conversion
- Format validation (emails, UUIDs, dates)
- Length and range validation
- Enum value validation

### Error Information Control
- Detailed validation errors in development
- Sanitized error messages in production
- No sensitive information leakage

## Performance Considerations

### Optimization Features
- Schema compilation happens once at startup
- Minimal overhead for valid requests
- Efficient sanitization algorithms
- Early validation failure detection

### Best Practices
- Use specific schemas rather than generic ones
- Combine validations when possible using `validate()`
- Cache compiled schemas for reuse
- Validate only necessary fields

## Testing

### Unit Tests
Run validation middleware tests:
```bash
npm test -- validation.test.js
```

### Integration Testing
Test validation with actual requests:
```bash
# Valid request
curl -X POST /api/v1/companies \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Company", "email": "test@example.com"}'

# Invalid request (should return 400)
curl -X POST /api/v1/companies \
  -H "Content-Type: application/json" \
  -d '{"name": "", "email": "invalid-email"}'
```

## Troubleshooting

### Common Issues

1. **Schema Import Errors**
   - Ensure schema is exported from `schemas/validation.js`
   - Check import path is correct
   - Verify schema is properly defined

2. **Validation Not Applied**
   - Check middleware order (validation should come after auth)
   - Ensure schema matches expected request structure
   - Verify route path matches exactly

3. **Type Conversion Issues**
   - Use `.transform()` for string-to-number conversion
   - Handle optional fields with `.optional()`
   - Use `.nullable()` for fields that can be null

### Debug Mode
Enable detailed validation logging:
```typescript
// In development
process.env.NODE_ENV = 'development';
// Validation errors will include full details
```

## Migration Guide

### Adding Validation to Existing Routes

1. **Import validation middleware:**
```typescript
import { validateRequest } from '../middleware/validation.js';
import { yourSchema } from '../schemas/validation.js';
```

2. **Add to route definition:**
```typescript
// Before
router.post('/endpoint', verifyToken, controller.method);

// After
router.post('/endpoint', verifyToken, validateRequest(yourSchema), controller.method);
```

3. **Create schema if needed:**
```typescript
// In schemas/validation.js
export const yourSchema = z.object({
  field: z.string().min(1, 'Field is required'),
  // ... other fields
});
```

### Updating Existing Validation
Replace manual validation with middleware:

```typescript
// Before - manual validation
router.post('/endpoint', (req, res) => {
  if (!req.body.name) {
    return res.status(400).json({ error: 'Name required' });
  }
  // ... rest of handler
});

// After - middleware validation
router.post('/endpoint', validateRequest(schema), (req, res) => {
  // req.body is already validated
  const { name } = req.body;
  // ... rest of handler
});
```