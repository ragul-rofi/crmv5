import { Router } from 'express';
import { query } from '../db.js';
import { verifyToken, AuthRequest } from '../auth.js';
import { requireReadOnlyWithComments } from '../middleware/roleMiddleware.js';
import { hasPermission, UserRole } from '../utils/roles.js';

const router = Router();

// Get all comments for a company
router.get('/company/:companyId', verifyToken, async (req, res) => {
  try {
    const result = await query(`
      SELECT c.*, u.full_name as user_name, u.role as user_role
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.company_id = $1
      ORDER BY c.created_at DESC
    `, [req.params.companyId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create comment (Head, SubHead, Manager, Admin can comment)
router.post('/', verifyToken, async (req: AuthRequest, res) => {
  try {
    const { content, company_id, parent_comment_id } = req.body;
    
    // Check if user has permission to comment
    const role = req.user?.role as UserRole;
    if (!hasPermission(role, 'canComment')) {
      return res.status(403).json({ 
        error: 'You do not have permission to add comments',
        hint: 'Only Head, SubHead, Manager, and Admin can comment'
      });
    }
    
    // Validate required fields
    if (!content || !company_id) {
      return res.status(400).json({ error: 'Content and company_id are required' });
    }
    
    // Check if company exists and is finalized (comments are mainly for finalized data)
    const companyCheck = await query(
      'SELECT id, finalization_status FROM companies WHERE id = $1',
      [company_id]
    );
    
    if (companyCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    // Insert comment
    const result = await query(
      `INSERT INTO comments (content, company_id, user_id, parent_comment_id) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [content, company_id, req.user?.id, parent_comment_id || null]
    );
    
    // Get comment with user info
    const commentResult = await query(`
      SELECT c.*, u.full_name as user_name, u.role as user_role
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.id = $1
    `, [result.rows[0].id]);
    
    res.status(201).json(commentResult.rows[0]);
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update comment (only own comments)
router.put('/:id', verifyToken, async (req: AuthRequest, res) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    // Check if comment exists and belongs to user
    const commentCheck = await query(
      'SELECT user_id FROM comments WHERE id = $1',
      [req.params.id]
    );
    
    if (commentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    // Only allow updating own comments (or Admin)
    const role = req.user?.role as UserRole;
    if (commentCheck.rows[0].user_id !== req.user?.id && role !== 'Admin') {
      return res.status(403).json({ error: 'You can only edit your own comments' });
    }
    
    const result = await query(
      `UPDATE comments 
       SET content = $1 
       WHERE id = $2 
       RETURNING *`,
      [content, req.params.id]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete comment (only own comments or Admin)
router.delete('/:id', verifyToken, async (req: AuthRequest, res) => {
  try {
    // Check if comment exists and belongs to user
    const commentCheck = await query(
      'SELECT user_id FROM comments WHERE id = $1',
      [req.params.id]
    );
    
    if (commentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    // Only allow deleting own comments (or Admin)
    const role = req.user?.role as UserRole;
    if (commentCheck.rows[0].user_id !== req.user?.id && role !== 'Admin') {
      return res.status(403).json({ error: 'You can only delete your own comments' });
    }
    
    await query('DELETE FROM comments WHERE id = $1', [req.params.id]);
    
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
