import { Router } from 'express';
import { query } from '../db.js';
import { verifyToken } from '../auth.js';
import { enforceReadOnly } from '../middleware/roleMiddleware.js';
import { validateRequest } from '../middleware/validation.js';
import { createContactSchema, updateContactSchema } from '../schemas/validation.js';

const router = Router();

// Get all contacts
router.get('/', verifyToken, async (req, res) => {
  try {
    const result = await query(`
      SELECT c.*, co.name as company_name 
      FROM contacts c
      LEFT JOIN companies co ON c."companyId" = co.id
      ORDER BY c.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create contact (Managers and DataCollectors)
router.post('/', verifyToken, enforceReadOnly, validateRequest(createContactSchema), async (req, res) => {
  try {
    const { name, email, phone, companyId } = req.body;
    
    const result = await query(
      'INSERT INTO contacts (name, email, phone, "companyId") VALUES ($1, $2, $3, $4) RETURNING *',
      [name, email, phone, companyId]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create contact error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update contact (Managers and DataCollectors)
router.put('/:id', verifyToken, enforceReadOnly, validateRequest(updateContactSchema), async (req, res) => {
  try {
    const { name, email, phone, companyId } = req.body;
    
    const result = await query(
      'UPDATE contacts SET name = $1, email = $2, phone = $3, "companyId" = $4 WHERE id = $5 RETURNING *',
      [name, email, phone, companyId, req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update contact error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete contact (Managers and DataCollectors)
router.delete('/:id', verifyToken, enforceReadOnly, async (req, res) => {
  try {
    const result = await query('DELETE FROM contacts WHERE id = $1 RETURNING *', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
