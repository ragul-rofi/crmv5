# Company Data Page - Pending Items Audit Report
**Generated:** October 31, 2025  
**Scope:** UI/UX and Backend Logic Review

---

## Executive Summary

Comprehensive audit of the company data page revealed **8 critical gaps** requiring attention before production deployment. The main concerns are:
- ❌ **Missing server-side permission checks** on finalize/unfinalize endpoints
- ❌ **No follow-up date validation** server-side (client validation exists)
- ❌ **CSV import lacks server-side validation** endpoint
- ⚠️ **Missing transaction/concurrency protection** for finalize operations
- ⚠️ **No audit logging** for critical operations (import, finalize, delete)
- ⚠️ **Potential performance issues** with COUNT(*) on large datasets

---

## 1. Server-Side Permission Enforcement ❌ CRITICAL

### Current State
Routes are protected but finalize endpoints lack explicit permission middleware:

**File:** `server/routes/v1/companies.routes.ts`
```typescript
// Finalize endpoints - Uses requireFinalizers middleware ✅
router.put('/:id/finalize', verifyToken, requireFinalizers, validateParams(uuidParamSchema), companyController.finalizeCompany);
router.put('/:id/unfinalize', verifyToken, requireFinalizers, validateParams(uuidParamSchema), companyController.unfinalizeCompany);
```

**Good:** `requireFinalizers` middleware is applied ✅

**File:** `server/routes/v1/contacts.routes.ts`
```typescript
// All routes use enforceReadOnly - GOOD ✅
router.post('/', verifyToken, enforceReadOnly, validateRequest(createContactSchema), contactController.create.bind(contactController));
router.put('/:id', verifyToken, enforceReadOnly, validateParams(uuidParamSchema), validateRequest(updateContactSchema), contactController.update.bind(contactController));
router.delete('/:id', verifyToken, enforceReadOnly, validateParams(uuidParamSchema), contactController.delete.bind(contactController));
```

**File:** `server/routes/v1/tickets.routes.ts`
```typescript
// Ticket creation allows all authenticated users ⚠️
router.post('/', verifyToken, validateRequest(createTicketSchema), ticketController.create.bind(ticketController));
// Delete requires taskAssigners role ✅
router.delete('/:id', verifyToken, requireTaskAssigners, validateParams(uuidParamSchema), ticketController.delete.bind(ticketController));
```

**File:** `server/routes/v1/follow-ups.routes.ts`
```typescript
// All mutating routes use enforceReadOnly ✅
router.post("/", verifyToken, enforceReadOnly, validateRequest(createFollowUpSchema), createFollowUp);
router.put("/:id", verifyToken, enforceReadOnly, validateParams(uuidParamSchema), validateRequest(updateFollowUpSchema), updateFollowUp);
router.delete("/:id", verifyToken, enforceReadOnly, validateParams(uuidParamSchema), deleteFollowUp);
```

### Issues Found
1. **Bulk Approval endpoint lacks role validation:**
   - File: `server/routes/v1/companies.routes.ts`
   - Endpoint: `PUT /approvals/bulk`
   - Only has `verifyToken` - no role check middleware ❌
   - Controller method `bulkApprovalAction` accepts any authenticated user
   
2. **Follow-up DELETE lacks Admin special-case handling:**
   - File: `server/routes/v1/follow-ups.routes.ts`
   - Current: All roles go through same delete handler
   - Expected: Admin should delete directly; others create deletion request
   - No role-based branching logic in `deleteFollowUp` handler ❌

### Recommended Fixes
```typescript
// In companies.routes.ts - Add role check for bulk approval
router.put('/approvals/bulk', 
  verifyToken, 
  requireManagers, // ADD THIS
  validateRequest(bulkApprovalActionSchema), 
  companyController.bulkApprovalAction
);

// In follow-ups.routes.ts - Implement Admin vs non-Admin delete logic
const deleteFollowUp: RequestHandler = async (req, res) => {
  const userId = (req as any).user?.id;
  const userRole = (req as any).user?.role;
  
  // Admin can delete directly
  if (userRole === 'Admin') {
    const result = await query(`DELETE FROM follow_ups WHERE id = $1 RETURNING id`, [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Follow-up not found" });
    }
    return res.json({ success: true, data: { message: "Follow-up deleted successfully" } });
  }
  
  // Others must create deletion request
  // Redirect to followup-deletion-requests.routes.ts logic
  // ... (create deletion request flow)
};
```

---

## 2. CSV Import Server-Side Validation ❌ CRITICAL

### Current State
**Frontend-only CSV import implementation:**
- File: `src/pages/data/ImportCompaniesModal.tsx`
- Uses `Papa.parse` to parse CSV client-side
- Transforms and validates data in browser
- Calls `api.createCompany()` for each row (one-by-one POST requests)

**No dedicated import endpoint found:**
- Searched: `server/controllers/CompanyController.ts` - No import method
- Searched: `server/routes/v1/*.ts` - No bulk import endpoint
- Current approach: Frontend loops and creates companies individually

### Issues
1. **No server-side CSV validation** ❌
   - Malformed CSV files can bypass client checks
   - No rate limiting for bulk operations
   - No sanitization of imported data server-side
   
2. **No transactional import** ❌
   - If row 50 of 100 fails, first 49 are already committed
   - No rollback mechanism
   - Partial imports leave inconsistent data state

3. **Performance concerns** ⚠️
   - N individual POST requests for N companies
   - No batching or bulk insert
   - High network overhead for large imports

4. **Security gaps** ❌
   - `company_type` mapping done client-side only
   - No server-side enum validation
   - CSV could inject unexpected values if client validation bypassed

### Recommended Fixes

**Add bulk import endpoint:**
```typescript
// In server/routes/v1/companies.routes.ts
import { bulkImportCompaniesSchema } from '../../schemas/validation.js';
import { auditMiddleware } from '../../middleware/audit.js';

router.post('/import', 
  verifyToken, 
  enforceReadOnly, 
  validateRequest(bulkImportCompaniesSchema),
  auditMiddleware('company_import', { 
    logSensitiveOperations: true, 
    includeRequestBody: false  // CSV could be large
  }),
  companyController.bulkImportCompanies
);
```

**Add validation schema:**
```typescript
// In server/schemas/validation.ts
export const bulkImportCompaniesSchema = z.object({
  companies: z.array(createCompanySchema).min(1).max(1000) // Limit batch size
});
```

**Implement controller method:**
```typescript
// In server/controllers/CompanyController.ts
bulkImportCompanies = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { companies } = req.body;
    const userId = req.user!.id;
    
    // Use transaction for atomicity
    const result = await this.companyService.bulkCreateCompanies(companies, userId);
    
    return sendSuccess(res, { 
      message: 'Companies imported successfully', 
      imported: result.count,
      failed: result.errors 
    }, undefined, 201);
  } catch (error) {
    next(error);
  }
};
```

**Service implementation with transaction:**
```typescript
// In server/services/CompanyService.ts
async bulkCreateCompanies(companies: any[], userId: string) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const results = [];
    const errors = [];
    
    for (let i = 0; i < companies.length; i++) {
      try {
        const result = await client.query(
          `INSERT INTO companies (...) VALUES (...) RETURNING id`,
          [/* params */]
        );
        results.push(result.rows[0]);
      } catch (error) {
        errors.push({ row: i + 1, error: error.message });
      }
    }
    
    if (errors.length > 0 && errors.length === companies.length) {
      await client.query('ROLLBACK');
      throw new Error('All imports failed');
    }
    
    await client.query('COMMIT');
    return { count: results.length, errors };
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

---

## 3. Follow-Up Date Validation ❌ CRITICAL

### Current State
**Client-side validation exists:**
- Frontend enforces `follow_up_date > contacted_date`
- File: `src/pages/company-detail/CompanyFollowUps.tsx` (form validation)

**Server-side validation MISSING:**
- File: `server/schemas/validation.ts`
  ```typescript
  export const createFollowUpSchema = z.object({
    company_id: z.string().uuid('Invalid company ID'),
    contacted_date: z.string().min(1, 'Contacted date is required'),
    follow_up_date: z.string().min(1, 'Follow-up date is required'),
    follow_up_notes: z.string().optional(),
  });
  ```
  - No date comparison validation ❌
  - Only checks for presence, not logic

### Issues
1. Direct API calls can bypass client validation ❌
2. Database constraint missing (relies on app logic only) ❌
3. Update endpoint also lacks validation ❌

### Recommended Fix
```typescript
// In server/schemas/validation.ts
export const createFollowUpSchema = z.object({
  company_id: z.string().uuid('Invalid company ID'),
  contacted_date: z.string().min(1, 'Contacted date is required').refine((val) => {
    return !isNaN(Date.parse(val));
  }, { message: 'Invalid contacted date format' }),
  follow_up_date: z.string().min(1, 'Follow-up date is required').refine((val) => {
    return !isNaN(Date.parse(val));
  }, { message: 'Invalid follow-up date format' }),
  follow_up_notes: z.string().optional(),
}).refine((data) => {
  const contacted = new Date(data.contacted_date);
  const followUp = new Date(data.follow_up_date);
  return followUp > contacted;
}, {
  message: 'Follow-up date must be after contacted date',
  path: ['follow_up_date']
});

// Also add to update schema
export const updateFollowUpSchema = z.object({
  contacted_date: z.string().optional().refine((val) => {
    if (!val) return true;
    return !isNaN(Date.parse(val));
  }, { message: 'Invalid contacted date format' }),
  follow_up_date: z.string().optional().refine((val) => {
    if (!val) return true;
    return !isNaN(Date.parse(val));
  }, { message: 'Invalid follow-up date format' }),
  follow_up_notes: z.string().optional(),
}).refine((data) => {
  if (data.contacted_date && data.follow_up_date) {
    const contacted = new Date(data.contacted_date);
    const followUp = new Date(data.follow_up_date);
    return followUp > contacted;
  }
  return true;
}, {
  message: 'Follow-up date must be after contacted date',
  path: ['follow_up_date']
});
```

**Also add DB constraint:**
```sql
-- Add check constraint to follow_ups table
ALTER TABLE follow_ups 
ADD CONSTRAINT follow_up_date_after_contacted 
CHECK (follow_up_date > contacted_date);
```

---

## 4. Finalize Concurrency & Transactions ⚠️ HIGH PRIORITY

### Current State
**File:** `server/services/CompanyService.ts`
```typescript
async finalizeCompany(id: string, userId: string): Promise<Company | null> {
  const result = await query(
    `UPDATE companies SET finalization_status = 'Finalized', finalized_by_id = $1, finalized_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
    [userId, id]
  );
  return result.rows[0] || null;
}
```

### Issues
1. **No optimistic locking** ❌
   - Two users can finalize same company concurrently
   - Last write wins (no version check)
   
2. **No transaction** ⚠️
   - Finalize might be part of larger workflow
   - No rollback if subsequent operations fail

3. **No status transition validation** ⚠️
   - Can finalize from any `conversionStatus`
   - Should only finalize when `conversionStatus = 'Confirmed'`

### Recommended Fixes

**Add version-based optimistic locking:**
```sql
-- Migration: Add version column
ALTER TABLE companies ADD COLUMN version INTEGER DEFAULT 1;
```

```typescript
// In CompanyService.ts
async finalizeCompany(id: string, userId: string, expectedVersion?: number): Promise<Company | null> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Check current state and conversion status
    const checkResult = await client.query(
      `SELECT finalization_status, conversion_status, version 
       FROM companies WHERE id = $1 FOR UPDATE`,
      [id]
    );
    
    if (!checkResult.rows[0]) {
      throw new Error('Company not found');
    }
    
    const current = checkResult.rows[0];
    
    // Validate can finalize
    if (current.finalization_status === 'Finalized') {
      throw new Error('Company already finalized');
    }
    
    if (current.conversion_status !== 'Confirmed') {
      throw new Error('Can only finalize companies with Confirmed conversion status');
    }
    
    // Optimistic lock check
    if (expectedVersion && current.version !== expectedVersion) {
      throw new Error('Company was modified by another user. Please refresh and try again.');
    }
    
    // Finalize with version bump
    const result = await client.query(
      `UPDATE companies 
       SET finalization_status = 'Finalized', 
           finalized_by_id = $1, 
           finalized_at = CURRENT_TIMESTAMP,
           version = version + 1
       WHERE id = $2 
       RETURNING *`,
      [userId, id]
    );
    
    await client.query('COMMIT');
    return result.rows[0] || null;
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

---

## 5. Audit Logging Gaps ⚠️ HIGH PRIORITY

### Current State
**Audit middleware exists:**
- File: `server/middleware/audit.ts`
- Provides `auditMiddleware` function
- Logs to `audit_logs` and `security_events` tables

**Current coverage:**
- ✅ Generic audit logging available
- ❌ Not applied to finalize endpoints
- ❌ Not applied to bulk approval endpoints
- ❌ No CSV import logging (no endpoint exists)
- ❌ Not applied to follow-up deletion

### Missing Audit Trails
1. **Company finalize/unfinalize** - No audit ❌
2. **Bulk approval actions** - No audit ❌
3. **CSV imports** - No audit (no endpoint) ❌
4. **Follow-up deletions** - No audit ❌
5. **Contact/Ticket creates** - No audit ❌

### Recommended Fixes

**Add audit middleware to routes:**
```typescript
// In server/routes/v1/companies.routes.ts
import { auditMiddleware } from '../../middleware/audit.js';
import { logSensitiveOperation } from '../../middleware/roleMiddleware.js';

router.put('/:id/finalize', 
  verifyToken, 
  requireFinalizers, 
  validateParams(uuidParamSchema),
  auditMiddleware('company', { logSensitiveOperations: true }),
  logSensitiveOperation('FINALIZE_COMPANY'),
  companyController.finalizeCompany
);

router.put('/:id/unfinalize', 
  verifyToken, 
  requireFinalizers, 
  validateParams(uuidParamSchema),
  auditMiddleware('company', { logSensitiveOperations: true }),
  logSensitiveOperation('UNFINALIZE_COMPANY'),
  companyController.unfinalizeCompany
);

router.put('/approvals/bulk', 
  verifyToken, 
  requireManagers,
  validateRequest(bulkApprovalActionSchema),
  auditMiddleware('company_approval', { logSensitiveOperations: true, includeRequestBody: true }),
  logSensitiveOperation('BULK_APPROVAL'),
  companyController.bulkApprovalAction
);

// Future import endpoint
router.post('/import',
  verifyToken,
  enforceReadOnly,
  validateRequest(bulkImportCompaniesSchema),
  auditMiddleware('company_import', { logSensitiveOperations: true }),
  logSensitiveOperation('IMPORT_COMPANIES'),
  companyController.bulkImportCompanies
);
```

```typescript
// In server/routes/v1/follow-ups.routes.ts
router.delete("/:id", 
  verifyToken, 
  enforceReadOnly, 
  validateParams(uuidParamSchema),
  auditMiddleware('follow_up', { logSensitiveOperations: true }),
  logSensitiveOperation('DELETE_FOLLOWUP'),
  deleteFollowUp
);
```

```typescript
// In server/routes/v1/contacts.routes.ts
router.post('/', 
  verifyToken, 
  enforceReadOnly, 
  validateRequest(createContactSchema),
  auditMiddleware('contact', {}),
  contactController.create.bind(contactController)
);
```

---

## 6. Pagination Performance ⚠️ MEDIUM PRIORITY

### Current State
**File:** `server/services/CompanyService.ts`
```typescript
async findAll(pagination: PaginationParams, filters?: CompanyFilters) {
  // ... query with joins
  let countQuery = 'SELECT COUNT(*) as total FROM companies c';
  // ... WHERE clauses
  
  const [dataResult, countResult] = await Promise.all([
    query(queryText, params),
    query(countQuery, params.slice(0, -2))
  ]);
  
  const total = parseInt(countResult.rows[0].total);
  // ...
}
```

### Issues
1. **COUNT(*) with joins can be slow on large datasets** ⚠️
   - Current: Executes full COUNT on every page load
   - With 100k+ companies, this becomes expensive
   
2. **No caching of total count** ⚠️
   - Count changes infrequently but recalculated every request

3. **No index optimization hints** ⚠️
   - Queries lack explicit index usage guidance

### Recommended Fixes

**Option 1: Approximate counts for large datasets**
```typescript
async findAll(pagination: PaginationParams, filters?: CompanyFilters) {
  // Use PostgreSQL's approximate count for better performance
  const useApproximate = pagination.page > 1; // Only first page needs exact count
  
  let countQuery = useApproximate 
    ? `SELECT reltuples::bigint AS total FROM pg_class WHERE relname = 'companies'`
    : 'SELECT COUNT(*) as total FROM companies c';
  
  // ... rest of logic
}
```

**Option 2: Cache count with invalidation**
```typescript
// Cache count in Redis with 5-minute TTL
import { getCachedData, setCachedData } from '../redis.js';

async findAll(pagination: PaginationParams, filters?: CompanyFilters) {
  const cacheKey = `company_count:${JSON.stringify(filters)}`;
  
  let total = await getCachedData(cacheKey);
  if (!total) {
    const countResult = await query(countQuery, countParams);
    total = parseInt(countResult.rows[0].total);
    await setCachedData(cacheKey, total, 300); // 5 min TTL
  }
  
  // ... rest of logic
}

// Invalidate on create/delete
async createCompany(data: any, userId: string) {
  // ... create logic
  await invalidateCachedData('company_count:*'); // Clear all count caches
}
```

**Option 3: Add database indexes**
```sql
-- Add indexes for common filter paths
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_converter_public 
ON companies (assigned_converter_id, is_public);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_finalization 
ON companies (finalization_status) 
WHERE finalization_status IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_created_at 
ON companies (created_at DESC);

-- Analyze table after index creation
ANALYZE companies;
```

---

## 7. Follow-Up Deletion Workflow Validation ✅ IMPLEMENTED

### Current State
**File:** `server/routes/v1/followup-deletion-requests.routes.ts`
- ✅ Deletion request system implemented
- ✅ Role-based access (Managers can review)
- ✅ Notifications created for requester and reviewers
- ✅ Approval workflow functional

**However: Frontend direct delete still exists**
- File: `src/pages/company-detail/CompanyFollowUps.tsx`
- Likely calls `DELETE /follow-ups/:id` directly
- Server route allows delete without role check beyond `enforceReadOnly`

### Required Change
**Frontend should route deletes through approval system:**
```typescript
// In CompanyFollowUps.tsx - modify delete mutation
const handleDelete = (followUpId: string) => {
  if (user?.role === 'Admin') {
    // Admin deletes directly
    deleteMutation.mutate(followUpId);
  } else {
    // Others create deletion request
    createDeletionRequestMutation.mutate({
      followup_id: followUpId,
      reason: 'User requested deletion'
    });
  }
};
```

**Backend should enforce:**
```typescript
// In follow-ups.routes.ts
const deleteFollowUp: RequestHandler = async (req, res) => {
  const userRole = (req as any).user?.role;
  
  // Only Admin can delete directly
  if (userRole !== 'Admin') {
    return res.status(403).json({
      success: false,
      error: 'Only administrators can delete follow-ups directly. Please create a deletion request.',
      timestamp: new Date().toISOString()
    });
  }
  
  // ... proceed with delete for Admin
};
```

---

## 8. Approval Queue Testing Needs ⚠️ HIGH PRIORITY

### Current Implementation
**Files reviewed:**
- `server/services/CompanyService.ts` - `getApprovalQueue`, `bulkApprove`, `bulkReject`
- `server/controllers/CompanyController.ts` - `getApprovalQueue`, `bulkApprovalAction`
- `server/routes/v1/companies.routes.ts` - Routes wired up

**Functionality:**
- ✅ Role-based queue filtering (Converter sees only assigned, Managers see all)
- ✅ Bulk approve updates `finalization_status` to 'Finalized'
- ✅ Bulk reject resets `finalization_status`
- ⚠️ No notifications created on approval/rejection
- ❌ No role check on bulk endpoint (see Issue #1)

### Testing Required
1. **Multi-role approval flow:**
   - Converter submits → Manager approves → Verify notifications
   - Head/SubHead approval permissions
   
2. **State transitions:**
   - Verify only 'Pending' companies can be approved
   - Ensure 'Finalized' companies can't be re-approved
   
3. **Edge cases:**
   - Empty `ids` array (handled with validation ✅)
   - Invalid company IDs
   - Companies already reviewed
   
4. **Notification system:**
   - Add notifications on bulk approve/reject ⚠️

### Recommended Addition
```typescript
// In CompanyService.ts - bulkApprove
async bulkApprove(ids: string[], role: UserRole, userId: string) {
  if (!ids.length) return { updated: 0 };
  
  const updateSQL = `
    UPDATE companies 
    SET finalization_status = 'Finalized',
        finalized_by_id = $1,
        finalized_at = CURRENT_TIMESTAMP
    WHERE id = ANY($2::uuid[]) AND finalization_status = 'Pending'
    RETURNING id, assigned_data_collector_id, assigned_converter_id, name
  `;
  
  const res = await query(updateSQL, [userId, ids]);
  
  // Create notifications for affected users
  for (const company of res.rows) {
    const affectedUsers = [company.assigned_data_collector_id, company.assigned_converter_id].filter(Boolean);
    
    for (const affectedUserId of affectedUsers) {
      await query(
        `INSERT INTO notifications (user_id, message, type, entity_type, entity_id)
         VALUES ($1, $2, 'success', 'company', $3)`,
        [
          affectedUserId,
          `Company "${company.name}" has been approved and finalized`,
          company.id
        ]
      );
    }
  }
  
  return { updated: res.rowCount || 0 };
}
```

---

## Priority Action Items

### 🔴 CRITICAL (Must Fix Before Production)
1. **Add server-side follow-up date validation** → Prevents invalid data
2. **Implement CSV import server endpoint** → Security & data integrity
3. **Add role check to bulk approval endpoint** → Authorization bypass risk
4. **Implement Admin vs non-Admin delete for follow-ups** → Business rule enforcement

### 🟡 HIGH PRIORITY (Fix Within Sprint)
1. **Add transaction + optimistic locking to finalize** → Data consistency
2. **Implement comprehensive audit logging** → Compliance & debugging
3. **Add notifications to approval workflow** → User experience
4. **Test approval queue with all roles** → Validate business logic

### 🟢 MEDIUM PRIORITY (Plan for Next Sprint)
1. **Optimize pagination COUNT queries** → Performance at scale
2. **Add database indexes** → Query performance
3. **Implement integration tests** → Regression prevention

---

## Testing Checklist

- [ ] **Permission Tests**
  - [ ] Verify requireFinalizers works on finalize endpoints
  - [ ] Test bulk approval with non-Manager role (should fail)
  - [ ] Verify enforceReadOnly blocks DataCollector from finalize
  - [ ] Test Admin follow-up delete vs non-Admin (deletion request)

- [ ] **Validation Tests**
  - [ ] Submit follow-up with follow_up_date < contacted_date (should fail)
  - [ ] Test CSV import with malformed data
  - [ ] Try finalize company with conversionStatus != 'Confirmed'
  - [ ] Test concurrent finalize from two users

- [ ] **Audit Tests**
  - [ ] Verify finalize creates audit_logs entry
  - [ ] Check bulk approval creates security_events
  - [ ] Confirm CSV import logged with row count
  - [ ] Validate follow-up delete logged

- [ ] **Workflow Tests**
  - [ ] Converter submits for approval → Manager approves → Verify notification
  - [ ] Test bulk reject → Verify status reset
  - [ ] Admin deletes follow-up directly → Success
  - [ ] DataCollector tries delete → Deletion request created

- [ ] **Performance Tests**
  - [ ] Measure COUNT query time with 100k companies
  - [ ] Test CSV import with 1000 rows
  - [ ] Verify pagination response time < 500ms

---

## Files Requiring Changes

### Server Files
1. `server/routes/v1/companies.routes.ts` - Add role check to bulk approval, add import endpoint
2. `server/routes/v1/follow-ups.routes.ts` - Implement Admin delete logic
3. `server/schemas/validation.ts` - Add follow-up date validation, bulk import schema
4. `server/services/CompanyService.ts` - Add transaction to finalize, add bulkImport method
5. `server/controllers/CompanyController.ts` - Add bulkImportCompanies method
6. All mutation routes - Add audit middleware

### Database Migrations
1. Add `version` column to companies table (optimistic locking)
2. Add check constraint to follow_ups for date validation
3. Create indexes for companies filtering

### Frontend Files
1. `src/pages/company-detail/CompanyFollowUps.tsx` - Route deletes through approval for non-Admins
2. `src/pages/data/ImportCompaniesModal.tsx` - Switch to bulk import endpoint (once created)

---

## Conclusion

The company data page has solid foundations with middleware patterns and role-based access controls in place. However, **critical gaps exist in server-side validation, audit logging, and permission enforcement** that must be addressed before production deployment.

**Estimated Effort:**
- Critical fixes: 3-5 days
- High priority items: 2-3 days
- Medium priority items: 2-3 days
- **Total: ~2 weeks** for full remediation

**Next Steps:**
1. Review this report with team
2. Prioritize fixes based on deployment timeline
3. Create JIRA tickets for each item
4. Implement critical fixes first
5. Add integration tests to prevent regression
