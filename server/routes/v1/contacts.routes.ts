import { Router } from 'express';
import { ContactController } from '../../controllers/ContactController.js';
import { verifyToken } from '../../auth.js';
import { enforceReadOnly } from '../../middleware/roleMiddleware.js';
import { validateRequest, validateParams } from '../../middleware/validation.js';
import { createContactSchema, updateContactSchema, uuidParamSchema } from '../../schemas/validation.js';
import { auditMiddleware } from '../../middleware/audit.js';

const router = Router();
const contactController = new ContactController();

// Get all contacts with pagination
router.get('/', verifyToken, contactController.getAll.bind(contactController));

// Create contact (Managers and DataCollectors)
router.post('/', verifyToken, enforceReadOnly, validateRequest(createContactSchema), auditMiddleware('contact', {}), contactController.create.bind(contactController));

// Update contact (Managers and DataCollectors)
router.put('/:id', verifyToken, enforceReadOnly, validateParams(uuidParamSchema), validateRequest(updateContactSchema), auditMiddleware('contact', {}), contactController.update.bind(contactController));

// Delete contact (Managers and DataCollectors)
router.delete('/:id', verifyToken, enforceReadOnly, validateParams(uuidParamSchema), auditMiddleware('contact', { logSensitiveOperations: true }), contactController.delete.bind(contactController));

export default router;