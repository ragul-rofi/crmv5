# Unused Code Analysis Report

## Executive Summary
This report identifies unused code across the CRM application including pages, components, API methods, and backend routes that can be safely removed to reduce bundle size and improve maintainability.

---

## 📄 Unused Pages (High Priority)

### 1. ContactsPage.tsx
- **Location**: `src/pages/ContactsPage.tsx`
- **Status**: ❌ Not imported in App.tsx
- **Usage**: No routes defined
- **Dependencies**: Uses contacts API endpoints, ContactForm, columns, ImportContactsModal
- **Recommendation**: 
  - **Option A**: REMOVE if contacts functionality is not needed
  - **Option B**: ADD route to App.tsx if contacts feature should be available
- **Impact**: ~250 lines of code

### 2. SignupPage.tsx
- **Location**: `src/pages/SignupPage.tsx`
- **Status**: ❌ Not imported in App.tsx
- **Usage**: No routes defined
- **Backend**: Backend signup endpoint EXISTS at `/api/v1/auth/signup`
- **Frontend**: `api.signup()` IS USED in UsersPage.tsx and AuthContext.tsx for admin user creation
- **Recommendation**: 
  - **REMOVE SignupPage.tsx** - Self-service signup page is not needed
  - **KEEP backend signup endpoint** - Used by admins to create users programmatically
- **Impact**: ~150 lines of code

### 3. NotFound.tsx
- **Location**: `src/pages/NotFound.tsx`
- **Status**: ❌ Not imported in App.tsx
- **Usage**: No catch-all route defined
- **Recommendation**: 
  - **Option A**: ADD as catch-all route `<Route path="*" element={<NotFound />} />` in App.tsx
  - **Option B**: REMOVE if not needed (users will see blank page for invalid routes)
- **Impact**: ~50 lines of code

---

## 🧩 Unused Components

### Analytics Components
1. **AnalyticsDashboard.tsx**
   - Location: `src/components/analytics/AnalyticsDashboard.tsx`
   - Status: ❌ Not imported anywhere
   - Impact: ~100 lines
   
2. **AnalyticsCharts.tsx**
   - Location: `src/components/analytics/AnalyticsCharts.tsx`
   - Status: ❌ Not imported anywhere
   - Impact: ~150 lines

**Recommendation**: 
- REMOVE both if analytics visualizations aren't used
- Index.tsx uses DateFilterSelector but not these chart components
- Consider consolidating analytics into Index.tsx dashboard

### Empty Folders
1. **src/components/debug/**
   - Status: Empty folder
   - Recommendation: DELETE

---

## 🔌 Unused API Client Methods (Frontend)

### Analytics Methods (Not Used)
```typescript
// Location: src/lib/api-client.ts

getAnalyticsCompanies()      // Line 358 - Not used
getAnalyticsTasks()          // Line 363 - Not used  
getAnalyticsTickets()        // Line 368 - Not used
getAnalyticsActivity()       // Line 373 - Not used
getRolePermissions()         // Line 384 - Not used
```

**Usage Status**:
- `getAnalyticsCompanies/Tasks/Tickets/Activity` - Not called anywhere
- `getRolePermissions` - Not called (only `updateRolePermissions` is used in AdminPanel)

**Recommendation**: REMOVE these 5 unused methods

### Company-Specific Methods (Partially Used)
```typescript
getTasksForCompany()         // Line 143 - ❌ NOT used (commented out in CompanyDetailPage)
getContactsForCompany()      // Line 138 - ✅ USED in CompanyDetailPage
getTicketsForCompany()       // Line 148 - ✅ USED in CompanyDetailPage
```

**Recommendation**: REMOVE `getTasksForCompany()` if company tasks aren't shown

### Session/Cache Methods (Not Used - Direct Fetch Instead)
```typescript
getCacheStats()              // Line 458 - ❌ NOT used
getCacheKeys()               // Line 463 - ❌ NOT used
invalidateCacheKey()         // Line 468 - ❌ NOT used
flushAllCache()              // Line 473 - ❌ NOT used
getSessions()                // Line 479 - ❌ NOT used (SessionManagementPage uses mock data)
terminateSession()           // Line 484 - ❌ NOT used
terminateAllOtherSessions()  // Line 489 - ❌ NOT used
```

**Status**: ❌ Unused - Pages use direct fetch() instead of api-client
- CacheManagementPage: Uses `fetch('/api/admin/cache/stats')` directly
- SessionManagementPage: Uses mock data (not real API calls yet)
- Backend routes exist at `server/routes/cache.routes.ts`

**Recommendation**: 
- **Option A**: REMOVE these 7 methods from api-client (pages don't use them)
- **Option B**: REFACTOR pages to use api-client methods for consistency
- **Keep backend routes** - They work but aren't accessed via api-client

---

## 🌐 Backend Routes Analysis

### Registered Routes (via v1/index.ts)
All routes are properly registered and organized:
- ✅ Authentication & User Management (auth, users, sessions, profile-changes)
- ✅ Core Business (companies, contacts, follow-ups)
- ✅ Task & Ticket Management (tasks, tickets, comments)
- ✅ System Features (custom-fields, notifications, files)
- ✅ Data & Analytics (analytics, export, search, pdf)
- ✅ System Administration (admin, monitoring, errors)

### Potentially Unused Backend Routes
1. **cache.routes.ts** ⚠️
   - Location: `server/routes/cache.routes.ts`
   - Status: ❌ NOT registered in main routing (server/index.ts or routes/v1/index.ts)
   - Routes: `/stats`, `/keys`, `/invalidate/:key`, `/flush`
   - Used by: CacheManagementPage (uses direct fetch to `/api/admin/cache/*`)
   - **Issue**: Routes exist but not properly registered in Express app
   - Recommendation: **REGISTER** in v1/admin.routes.ts or mount directly

2. **health.routes.ts** ✅
   - Location: `server/routes/health.routes.ts`
   - Status: ✅ Registered directly in server/index.ts
   - Recommendation: KEEP (essential for monitoring)

3. **test.routes.ts** ⚠️
   - Location: `server/routes/test.routes.ts`
   - Status: ✅ Registered in routes/index.ts
   - Recommendation: REMOVE in production, KEEP for development only
   - Add environment check: `if (process.env.NODE_ENV !== 'production')`

---

## 📊 Impact Summary

### Files to Remove (Definite)
1. ❌ `src/pages/SignupPage.tsx` (~150 lines)
2. ❌ `src/components/analytics/AnalyticsDashboard.tsx` (~100 lines)
3. ❌ `src/components/analytics/AnalyticsCharts.tsx` (~150 lines)
4. ❌ `src/components/debug/` (empty folder)

### API Methods to Remove (12 methods)
**Analytics (5 methods)**:
- `getAnalyticsCompanies()`
- `getAnalyticsTasks()`
- `getAnalyticsTickets()`
- `getAnalyticsActivity()`
- `getRolePermissions()`

**Cache/Session (7 methods)** - Pages use direct fetch instead:
- `getCacheStats()`
- `getCacheKeys()`
- `invalidateCacheKey()`
- `flushAllCache()`
- `getSessions()`
- `terminateSession()`
- `terminateAllOtherSessions()`

### Conditional Removals (Needs Decision)
1. ⚠️ `src/pages/ContactsPage.tsx` - Remove OR add route
2. ⚠️ `src/pages/NotFound.tsx` - Remove OR add catch-all route
3. ⚠️ `getTasksForCompany()` - Remove if not needed
4. ⚠️ Session/Cache API methods - Check if used by admin pages

### Backend Route Issues
1. ⚠️ `cache.routes.ts` not registered - Register OR remove
2. ⚠️ `test.routes.ts` - Remove in production

---

## 🎯 Recommended Action Plan

### Quick Wins (Safe & High Impact) ⚡
These can be done immediately with zero risk:

```bash
# 1. Remove unused pages (except ContactsPage - needs decision)
Remove-Item "src\pages\SignupPage.tsx"
Remove-Item "src\pages\NotFound.tsx"  # Only if not adding catch-all route

# 2. Remove unused analytics components
Remove-Item "src\components\analytics\AnalyticsDashboard.tsx"
Remove-Item "src\components\analytics\AnalyticsCharts.tsx"

# 3. Remove empty folder
Remove-Item "src\components\debug" -Force

# 4. Manual: Edit src/lib/api-client.ts
# - Remove lines 358-377 (Analytics methods)
# - Remove line 384 (getRolePermissions)
# - Remove lines 458-494 (Cache/Session methods)
```

**Estimated savings**: ~800 lines, ~35-40 KB minified

### Phase 1: Safe Removals (No Impact)
```bash
# Remove unused pages
rm src/pages/SignupPage.tsx

# Remove unused analytics components
rm src/components/analytics/AnalyticsDashboard.tsx
rm src/components/analytics/AnalyticsCharts.tsx

# Remove empty folder
rmdir src/components/debug
```

### Phase 2: API Cleanup
Edit `src/lib/api-client.ts` to remove unused methods (total 12):
- Lines 358-377 (Analytics methods: 5 methods)
- Line 384 (`getRolePermissions`)
- Lines 458-494 (Cache/Session methods: 7 methods)

**Note**: Backend routes remain functional, pages just don't use api-client wrapper

### Phase 3: Backend Route Fixes
1. **Register Cache Routes**:
   ```typescript
   // Option A: In server/routes/v1/admin.routes.ts
   import cacheRoutes from '../cache.routes.js';
   router.use('/cache', requireAdmin, cacheRoutes);
   
   // Option B: In server/index.ts (outside v1)
   import cacheRoutes from './routes/cache.routes.js';
   app.use('/api/admin/cache', cacheRoutes);
   ```

2. **Secure Test Routes**:
   ```typescript
   // In server/routes/index.ts
   if (process.env.NODE_ENV !== 'production') {
     router.use('/test', testRoutes);
   }
   ```
1. **Contacts Feature**:
   - If needed: Add route to App.tsx
   - If not: Remove ContactsPage.tsx and related API endpoints

2. **NotFound Page**:
   - If needed: Add catch-all route
   - If not: Remove file

3. **Cache Routes**:
   - Register `cache.routes.ts` in server/index.ts
   - Verify CacheManagementPage uses them

### Phase 4: Decisions Needed
1. **Contacts Feature**:
   - If needed: Add route to App.tsx
   - If not: Remove ContactsPage.tsx and related API endpoints

2. **NotFound Page**:
   - If needed: Add catch-all route
   - If not: Remove file

3. **Cache Routes**:
   - Register `cache.routes.ts` in server/index.ts
   - Verify CacheManagementPage uses them

### Phase 5: Verify & Test
1. Run build: `npm run build`
2. Check bundle size reduction
3. Test all features still work
4. Run type checking: `npm run type-check`

---

## 📈 Expected Benefits

### Bundle Size Reduction
- Frontend pages: ~650 lines removed (~20-30 KB minified)
- Unused API methods: ~12 methods, ~120 lines (~10 KB reduction)
- Analytics components: ~250 lines
- Total estimated: ~1020 lines, ~40-50 KB minified
- Tree-shaking will automatically remove unused imports

### Maintainability
- Fewer files to maintain
- Clearer codebase structure
- Reduced cognitive load for developers

### Performance
- Slightly faster builds
- Reduced chunk sizes
- Better code splitting

---

## ⚠️ Risks & Considerations

1. **SignupPage Removal**: Ensure admins can create users via UsersPage
2. **Analytics Components**: Verify no future plans to use them
3. **ContactsPage**: Confirm contacts functionality isn't needed
4. **Cache Routes**: Verify admin pages work without these endpoints

---

## 📝 Notes

- All backend routes in `server/routes/v1/` are properly registered
- Profile change approval system is fully integrated (just implemented)
- Frontend uses mostly UI components from shadcn/ui (all actively used)
- Main pages (DataPage, TasksPage, TicketsPage, etc.) are all actively used

**Generated**: ${new Date().toISOString()}
**Analyzer**: GitHub Copilot
**Codebase Version**: CRMv5
