import { Router } from 'express';
import { query } from '../db.js';
import { verifyToken } from '../auth.js';
import bcrypt from 'bcrypt';
import { requireUserManagers, requireAdmin } from '../middleware/roleMiddleware.js';
import { validateRequest } from '../middleware/validation.js';
import { updateUserSchema } from '../schemas/validation.js';

const router = Router();

// Get users list for dropdowns (all authenticated users)
// Returns minimal user info for task/ticket assignment
router.get('/list', verifyToken, async (req, res) => {
  try {
    const result = await query('SELECT id, full_name, email FROM users ORDER BY full_name ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Get users list error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all users (Admin and Manager only)
router.get('/', verifyToken, requireUserManagers, async (req, res) => {
  try {
    const result = await query('SELECT id, email, full_name, role, created_at FROM users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single user
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const result = await query('SELECT id, email, full_name, role, created_at FROM users WHERE id = $1', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user (Admin and Manager only)
router.put('/:id', verifyToken, requireUserManagers, validateRequest(updateUserSchema), async (req, res) => {
  try {
    const { email, full_name, role, password } = req.body;
    
    let updateQuery = 'UPDATE users SET email = $1, full_name = $2, role = $3';
    let params = [email, full_name, role];
    
    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      updateQuery += ', password_hash = $4 WHERE id = $5 RETURNING id, email, full_name, role';
      params.push(passwordHash, req.params.id);
    } else {
      updateQuery += ' WHERE id = $4 RETURNING id, email, full_name, role';
      params.push(req.params.id);
    }
    
    const result = await query(updateQuery, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user (admin only)
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const result = await query('DELETE FROM users WHERE id = $1 RETURNING id', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
