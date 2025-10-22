import { Router } from 'express';
import { query } from '../db.js';
import { verifyToken, AuthRequest } from '../auth.js';
import { notifyTicketRaised, notifyTicketResolved } from '../utils/notifications.js';
import { enforceReadOnly, requireTaskAssigners } from '../middleware/roleMiddleware.js';
import { validateRequest } from '../middleware/validation.js';
import { createTicketSchema, updateTicketSchema } from '../schemas/validation.js';

const router = Router();

// Get all tickets
router.get('/', verifyToken, async (req, res) => {
  try {
    const result = await query(`
      SELECT t.*, c.name as company_name, 
             u1.full_name as raised_by_name,
             u2.full_name as assigned_to_name
      FROM tickets t
      LEFT JOIN companies c ON t."companyId" = c.id
      LEFT JOIN users u1 ON t."raisedById" = u1.id
      LEFT JOIN users u2 ON t."assignedToId" = u2.id
      ORDER BY t.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create ticket (All authenticated users can create tickets)
router.post('/', verifyToken, validateRequest(createTicketSchema), async (req: AuthRequest, res) => {
  try {
    const { title, description, companyId, assignedToId } = req.body;
    
    const result = await query(
      `INSERT INTO tickets (title, description, "companyId", "raisedById", "assignedToId") 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [title, description, companyId, req.user?.id, assignedToId]
    );
    
    // Create notification for assigned user
    if (assignedToId && assignedToId !== req.user?.id) {
      const raiserResult = await query('SELECT full_name FROM users WHERE id = $1', [req.user?.id]);
      const raiserName = raiserResult.rows[0]?.full_name || 'Someone';
      
      const companyResult = companyId ? await query('SELECT name FROM companies WHERE id = $1', [companyId]) : null;
      const companyName = companyResult?.rows[0]?.name;
      
      await notifyTicketRaised(assignedToId, title, raiserName, companyName);
    }
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update ticket (All authenticated users can update tickets they're involved in)
router.put('/:id', verifyToken, validateRequest(updateTicketSchema), async (req: AuthRequest, res) => {
  try {
    const { title, description, isResolved, assignedToId } = req.body;
    
    const result = await query(
      `UPDATE tickets SET title = $1, description = $2, "isResolved" = $3, "assignedToId" = $4,
       resolved_at = CASE WHEN $3 = true THEN CURRENT_TIMESTAMP ELSE NULL END
       WHERE id = $5 RETURNING *`,
      [title, description, isResolved, assignedToId, req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    // Notify ticket raiser if ticket is resolved
    if (isResolved && result.rows[0].raisedById && result.rows[0].raisedById !== req.user?.id) {
      const resolverResult = await query('SELECT full_name FROM users WHERE id = $1', [req.user?.id]);
      const resolverName = resolverResult.rows[0]?.full_name || 'Someone';
      await notifyTicketResolved(result.rows[0].raisedById, title, resolverName);
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update ticket error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete ticket (Admin and Manager only)
router.delete('/:id', verifyToken, requireTaskAssigners, async (req, res) => {
  try {
    const result = await query('DELETE FROM tickets WHERE id = $1 RETURNING *', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    res.json({ message: 'Ticket deleted successfully' });
  } catch (error) {
    console.error('Delete ticket error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
