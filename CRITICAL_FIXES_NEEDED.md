# Company Data Page - Quick Action Summary

## 🔴 CRITICAL ISSUES (Fix Immediately)

### 1. Bulk Approval Lacks Permission Check
**File:** `server/routes/v1/companies.routes.ts:26`
```typescript
// CURRENT (VULNERABLE):
router.put('/approvals/bulk', verifyToken, validateRequest(bulkApprovalActionSchema), companyController.bulkApprovalAction);

// FIX - Add requireManagers:
router.put('/approvals/bulk', verifyToken, requireManagers, validateRequest(bulkApprovalActionSchema), companyController.bulkApprovalAction);
```

### 2. Follow-Up Date Validation Missing Server-Side
**File:** `server/schemas/validation.ts:105-116`
```typescript
// ADD .refine() to enforce follow_up_date > contacted_date
export const createFollowUpSchema = z.object({
  company_id: z.string().uuid('Invalid company ID'),
  contacted_date: z.string().min(1, 'Contacted date is required'),
  follow_up_date: z.string().min(1, 'Follow-up date is required'),
  follow_up_notes: z.string().optional(),
}).refine((data) => {
  const contacted = new Date(data.contacted_date);
  const followUp = new Date(data.follow_up_date);
  return followUp > contacted;
}, {
  message: 'Follow-up date must be after contacted date',
  path: ['follow_up_date']
});
```

### 3. Admin Delete Not Enforced for Follow-Ups
**File:** `server/routes/v1/follow-ups.routes.ts:149`
```typescript
// ADD role check in deleteFollowUp handler:
const deleteFollowUp: RequestHandler = async (req, res) => {
  const userRole = (req as any).user?.role;
  
  if (userRole !== 'Admin') {
    return res.status(403).json({
      success: false,
      error: 'Only administrators can delete follow-ups directly. Please create a deletion request.'
    });
  }
  
  // ... existing delete logic for Admin only
};
```

### 4. CSV Import Needs Server Endpoint
**Status:** Frontend-only validation (bypassed via direct API calls)
**Action:** Create `POST /api/v1/companies/import` endpoint with:
- Server-side CSV validation
- Transactional bulk insert
- Audit logging
- Rate limiting

---

## 🟡 HIGH PRIORITY (This Sprint)

### 5. Finalize Needs Transaction + Optimistic Lock
**File:** `server/services/CompanyService.ts:188`
- Add version column to companies table
- Wrap finalize in BEGIN/COMMIT transaction
- Check `conversionStatus = 'Confirmed'` before finalize
- Implement version-based locking

### 6. Missing Audit Logging
**Files:** All route files
- Add `auditMiddleware` to finalize/unfinalize routes
- Add `logSensitiveOperation` to bulk approval
- Log CSV imports (when endpoint created)
- Log follow-up deletions

### 7. Approval Workflow Lacks Notifications
**File:** `server/services/CompanyService.ts:265-285`
- Create notifications on bulk approve
- Create notifications on bulk reject
- Notify data collectors and converters of status changes

---

## 🟢 MEDIUM PRIORITY (Next Sprint)

### 8. Pagination Performance
- Add indexes: `idx_companies_converter_public`, `idx_companies_finalization`
- Consider cached counts for large datasets
- Use approximate COUNT for pages > 1

---

## Quick Win Fixes (< 30 min each)

1. **Add requireManagers to bulk approval route** (5 min)
2. **Add .refine() to follow-up schemas** (10 min)
3. **Add Admin role check to follow-up delete** (15 min)
4. **Add auditMiddleware to existing routes** (20 min)

---

## Full Audit Report
See `PENDING_ITEMS_AUDIT.md` for:
- Detailed analysis of each issue
- Code examples and implementation guides
- Testing checklists
- Database migration scripts
- Effort estimates

---

## Deployment Blocker?
**YES** - Critical issues #1-3 must be fixed before production deployment to prevent:
- Authorization bypass (bulk approval)
- Invalid data entry (follow-up dates)
- Business rule violation (non-Admin deletes)
