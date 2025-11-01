import { Router } from 'express';
import { CompanyController } from '../../controllers/CompanyController.js';
import { verifyToken } from '../../auth.js';
import { enforceReadOnly, requireFinalizers, preventFinalizedEdit, logSensitiveOperation } from '../../middleware/roleMiddleware.js';
import { validateRequest, validateParams, validateQuery } from '../../middleware/validation.js';
import { createCompanySchema, updateCompanySchema, bulkApprovalActionSchema, bulkImportCompaniesSchema, uuidParamSchema, companyQuerySchema, paginationQuerySchema } from '../../schemas/validation.js';
import { auditMiddleware } from '../../middleware/audit.js';
// cacheMiddleware removed along with Redis

const router = Router();
const companyController = new CompanyController();

// GET routes
router.get('/', verifyToken, companyController.getCompanies);
router.get('/my', verifyToken, companyController.getMyCompanies);
router.get('/finalized', verifyToken, companyController.getFinalizedCompanies);
router.get('/approvals', verifyToken, companyController.getApprovalQueue);
router.get('/:id', verifyToken, companyController.getCompany);

// POST routes
router.post('/', verifyToken, enforceReadOnly, validateRequest(createCompanySchema), companyController.createCompany);
router.post('/import', verifyToken, enforceReadOnly, validateRequest(bulkImportCompaniesSchema), auditMiddleware('company_import', { logSensitiveOperations: true }), logSensitiveOperation('IMPORT_COMPANIES'), companyController.bulkImportCompanies);

// PUT routes
router.put('/:id', verifyToken, enforceReadOnly, preventFinalizedEdit, validateParams(uuidParamSchema), validateRequest(updateCompanySchema), auditMiddleware('company', {}), companyController.updateCompany);
router.put('/:id/finalize', verifyToken, requireFinalizers, validateParams(uuidParamSchema), auditMiddleware('company', { logSensitiveOperations: true }), logSensitiveOperation('FINALIZE_COMPANY'), companyController.finalizeCompany);
router.put('/:id/unfinalize', verifyToken, requireFinalizers, validateParams(uuidParamSchema), auditMiddleware('company', { logSensitiveOperations: true }), logSensitiveOperation('UNFINALIZE_COMPANY'), companyController.unfinalizeCompany);
router.put('/approvals/bulk', verifyToken, requireFinalizers, validateRequest(bulkApprovalActionSchema), auditMiddleware('company_approval', { logSensitiveOperations: true, includeRequestBody: true }), logSensitiveOperation('BULK_APPROVAL'), companyController.bulkApprovalAction);

// DELETE routes
router.delete('/:id', verifyToken, enforceReadOnly, preventFinalizedEdit, validateParams(uuidParamSchema), auditMiddleware('company', { logSensitiveOperations: true }), companyController.deleteCompany);

export default router;