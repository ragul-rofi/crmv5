import { Router } from 'express';
import { query } from '../db.js';
import { verifyToken, AuthRequest } from '../auth.js';
import { notifyTaskAssigned, notifyTaskUpdated } from '../utils/notifications.js';
import { requireTaskAssigners, enforceTaskUpdatePermission } from '../middleware/roleMiddleware.js';
import { validateRequest } from '../middleware/validation.js';
import { createTaskSchema, updateTaskSchema } from '../schemas/validation.js';

const router = Router();

// Get all tasks
router.get('/', verifyToken, async (req: AuthRequest, res) => {
  try {
    const result = await query(`
      SELECT t.*, c.name as company_name, u.full_name as assigned_to_name 
      FROM tasks t
      LEFT JOIN companies c ON t."companyId" = c.id
      LEFT JOIN users u ON t."assignedToId" = u.id
      ORDER BY t.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create task (Admin and Manager only - can assign tasks)
router.post('/', verifyToken, requireTaskAssigners, validateRequest(createTaskSchema), async (req: AuthRequest, res) => {
  try {
    const { title, description, status, deadline, companyId, assignedToId } = req.body;
    
    const result = await query(
      `INSERT INTO tasks (title, description, status, deadline, "companyId", "assignedToId", "assignedById") 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [title, description, status || 'NotYet', deadline, companyId, assignedToId, req.user?.id]
    );
    
    // Create notification if task is assigned to someone else
    if (assignedToId && assignedToId !== req.user?.id) {
      const assignerResult = await query('SELECT full_name FROM users WHERE id = $1', [req.user?.id]);
      const assignerName = assignerResult.rows[0]?.full_name || 'Someone';
      await notifyTaskAssigned(assignedToId, title, assignerName);
    }
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update task (Managers can update any, DataCollector/Converter can update only their assigned tasks)
router.put('/:id', verifyToken, enforceTaskUpdatePermission, validateRequest(updateTaskSchema), async (req: AuthRequest, res) => {
  try {
    const { title, description, status, deadline, companyId, assignedToId } = req.body;
    
    // If user can only update their own tasks, verify they are the assignee
    if (req.mustBeAssignedUser) {
      const taskCheck = await query('SELECT "assignedToId" FROM tasks WHERE id = $1', [req.params.id]);
      
      if (taskCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Task not found' });
      }
      
      if (taskCheck.rows[0].assignedToId !== req.user?.id) {
        return res.status(403).json({ 
          error: 'Forbidden: You can only update tasks assigned to you',
          hint: 'Contact your manager to reassign this task'
        });
      }
      
      // Task workers cannot reassign tasks
      if (assignedToId && assignedToId !== taskCheck.rows[0].assignedToId) {
        return res.status(403).json({ 
          error: 'Forbidden: You cannot reassign tasks',
          hint: 'Only managers can assign tasks to other users'
        });
      }
    }
    
    const result = await query(
      `UPDATE tasks SET title = $1, description = $2, status = $3, deadline = $4, "companyId" = $5, "assignedToId" = $6 
       WHERE id = $7 RETURNING *`,
      [title, description, status, deadline, companyId, assignedToId, req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Notify assigned user if they're not the one making the update
    if (assignedToId && assignedToId !== req.user?.id) {
      const updaterResult = await query('SELECT full_name FROM users WHERE id = $1', [req.user?.id]);
      const updaterName = updaterResult.rows[0]?.full_name || 'Someone';
      await notifyTaskUpdated(assignedToId, title, updaterName);
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete task (Admin and Manager only)
router.delete('/:id', verifyToken, requireTaskAssigners, async (req, res) => {
  try {
    const result = await query('DELETE FROM tasks WHERE id = $1 RETURNING *', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
