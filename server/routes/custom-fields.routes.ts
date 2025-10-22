import { Router } from 'express';
import { query } from '../db.js';
import { verifyToken } from '../auth.js';
import { requireCustomFieldManagers } from '../middleware/roleMiddleware.js';
import { validateRequest } from '../middleware/validation.js';
import { createCustomFieldSchema } from '../schemas/validation.js';

const router = Router();

// Get all custom field definitions
router.get('/', verifyToken, async (req, res) => {
  try {
    const result = await query('SELECT * FROM custom_field_definitions ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Get custom fields error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create custom field definition (Admin and Manager only)
router.post('/', verifyToken, requireCustomFieldManagers, validateRequest(createCustomFieldSchema), async (req, res) => {
  try {
    const { label, type } = req.body;
    
    const result = await query(
      'INSERT INTO custom_field_definitions (label, type) VALUES ($1, $2) RETURNING *',
      [label, type]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create custom field error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete custom field definition (Admin and Manager only)
router.delete('/:id', verifyToken, requireCustomFieldManagers, async (req, res) => {
  try {
    const result = await query('DELETE FROM custom_field_definitions WHERE id = $1 RETURNING *', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Custom field not found' });
    }
    
    res.json({ message: 'Custom field deleted successfully' });
  } catch (error) {
    console.error('Delete custom field error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
