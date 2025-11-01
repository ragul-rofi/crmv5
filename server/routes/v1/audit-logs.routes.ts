import { Router } from 'express';
import { verifyToken, AuthRequest } from '../../auth.js';
import db from '../../db.js';
import { requireAdmin } from '../../middleware/roleMiddleware.js';

const router = Router();

// Get audit logs (admin only)
router.get('/', verifyToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;
    
    const action = req.query.action as string;
    const entityType = req.query.entity_type as string;
    const userId = req.query.user_id as string;

    let query = `
      SELECT 
        al.*,
        u.username as user_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (action) {
      query += ` AND al.action = $${paramIndex++}`;
      params.push(action);
    }

    if (entityType) {
      query += ` AND al.entity_type = $${paramIndex++}`;
      params.push(entityType);
    }

    if (userId) {
      query += ` AND al.user_id = $${paramIndex++}`;
      params.push(userId);
    }

    // Get total count
    const countQuery = query.replace(/SELECT[\s\S]*FROM/, 'SELECT COUNT(*) as total FROM');
    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0]?.total || '0');

    // Get paginated results
    query += ` ORDER BY al.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    res.json({
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
