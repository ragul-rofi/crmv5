import { Router } from 'express';
import { query } from '../db.js';
import { verifyToken, AuthRequest } from '../auth.js';
import { validateRequest } from '../middleware/validation.js';
import { createNotificationSchema } from '../schemas/validation.js';

const router = Router();

// Get notifications for current user
router.get('/', verifyToken, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      'SELECT * FROM notifications WHERE "userId" = $1 ORDER BY created_at DESC LIMIT 50',
      [req.user!.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark notification as read
router.put('/:id/read', verifyToken, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      'UPDATE notifications SET "isRead" = true WHERE id = $1 AND "userId" = $2 RETURNING *',
      [req.params.id, req.user!.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark all notifications as read for current user
router.put('/mark-all-read', verifyToken, async (req: AuthRequest, res) => {
  try {
    await query(
      'UPDATE notifications SET "isRead" = true WHERE "userId" = $1 AND "isRead" = false',
      [req.user!.id]
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create notification (internal use - for system notifications)
router.post('/', verifyToken, validateRequest(createNotificationSchema), async (req, res) => {
  try {
    const { userId, message } = req.body;
    
    if (!userId || !message) {
      return res.status(400).json({ error: 'userId and message are required' });
    }
    
    const result = await query(
      'INSERT INTO notifications ("userId", message) VALUES ($1, $2) RETURNING *',
      [userId, message]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a notification
router.delete('/:id', verifyToken, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      'DELETE FROM notifications WHERE id = $1 AND "userId" = $2 RETURNING *',
      [req.params.id, req.user!.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
