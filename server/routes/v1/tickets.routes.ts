import { Router } from 'express';
import { TicketController } from '../../controllers/TicketController.js';
import { verifyToken } from '../../auth.js';
import { enforceReadOnly, requireTaskAssigners } from '../../middleware/roleMiddleware.js';
import { validateRequest, validateParams } from '../../middleware/validation.js';
import { createTicketSchema, updateTicketSchema, uuidParamSchema } from '../../schemas/validation.js';
import { auditMiddleware } from '../../middleware/audit.js';

const router = Router();
const ticketController = new TicketController();

// Get all tickets with pagination
router.get('/', verifyToken, ticketController.getAll.bind(ticketController));

// Get tickets assigned to current user with pagination
router.get('/my', verifyToken, ticketController.getMyTickets.bind(ticketController));

// Get count of open tickets for current user
router.get('/my/count', verifyToken, ticketController.getMyTicketsCount.bind(ticketController));

// Create ticket (All authenticated users can create tickets)
router.post('/', verifyToken, validateRequest(createTicketSchema), auditMiddleware('ticket', {}), ticketController.create.bind(ticketController));

// Update ticket (All authenticated users can update tickets they're involved in)
router.put('/:id', verifyToken, validateParams(uuidParamSchema), validateRequest(updateTicketSchema), auditMiddleware('ticket', {}), ticketController.update.bind(ticketController));

// Delete ticket (Admin and Manager only)
router.delete('/:id', verifyToken, requireTaskAssigners, validateParams(uuidParamSchema), auditMiddleware('ticket', { logSensitiveOperations: true }), ticketController.delete.bind(ticketController));

export default router;