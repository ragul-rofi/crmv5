import { Router, Request, Response } from 'express';
import { query } from '../../db.js';
import { verifyToken } from '../../auth.js';
import { z } from 'zod';

const router = Router();

// Schema for profile change request
const profileChangeRequestSchema = z.object({
  full_name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  region: z.string().optional(),
});

// Get my pending profile change requests
router.get('/my-requests', verifyToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    
    const result = await query(
      `SELECT pcr.*, 
              u.full_name as reviewed_by_name
       FROM profile_change_requests pcr
       LEFT JOIN users u ON pcr.reviewed_by = u.id
       WHERE pcr.user_id = $1
       ORDER BY pcr.requested_at DESC`,
      [userId]
    );
    
    res.json({ requests: result.rows });
  } catch (error: any) {
    console.error('Error fetching profile change requests:', error);
    res.status(500).json({ error: 'Failed to fetch profile change requests' });
  }
});

// Create a new profile change request
router.post('/request', verifyToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const requestedChanges = profileChangeRequestSchema.parse(req.body);
    
    // Check if there are any actual changes
    if (Object.keys(requestedChanges).length === 0) {
      return res.status(400).json({ error: 'No changes requested' });
    }
    
    // Check if user already has a pending request
    const existingRequest = await query(
      'SELECT id FROM profile_change_requests WHERE user_id = $1 AND status = $2',
      [userId, 'pending']
    );
    
    if (existingRequest.rows.length > 0) {
      return res.status(400).json({ 
        error: 'You already have a pending profile change request. Please wait for admin approval.' 
      });
    }
    
    // Get current user values
    const currentUser = await query(
      'SELECT full_name, email, region FROM users WHERE id = $1',
      [userId]
    );
    
    if (currentUser.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const currentValues = currentUser.rows[0];
    
    // Create the change request
    const result = await query(
      `INSERT INTO profile_change_requests 
       (user_id, requested_changes, current_values, status)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, JSON.stringify(requestedChanges), JSON.stringify(currentValues), 'pending']
    );
    
    res.status(201).json({ 
      message: 'Profile change request submitted successfully. Awaiting admin approval.',
      request: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error creating profile change request:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to create profile change request' });
  }
});

// Cancel a pending profile change request
router.delete('/request/:requestId', verifyToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { requestId } = req.params;
    
    // Only allow user to cancel their own pending requests
    const result = await query(
      `DELETE FROM profile_change_requests 
       WHERE id = $1 AND user_id = $2 AND status = $3
       RETURNING *`,
      [requestId, userId, 'pending']
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found or cannot be cancelled' });
    }
    
    res.json({ message: 'Profile change request cancelled successfully' });
  } catch (error: any) {
    console.error('Error cancelling profile change request:', error);
    res.status(500).json({ error: 'Failed to cancel profile change request' });
  }
});

// Admin: Get all pending profile change requests
router.get('/admin/pending', verifyToken, async (req: Request, res: Response) => {
  try {
    // Check if user is admin
    if ((req as any).user.role !== 'Admin') {
      return res.status(403).json({ error: 'Only admins can view all profile change requests' });
    }
    
    const result = await query(
      `SELECT pcr.*, 
              u.full_name, u.email, u.role, u.region
       FROM profile_change_requests pcr
       JOIN users u ON pcr.user_id = u.id
       WHERE pcr.status = $1
       ORDER BY pcr.requested_at ASC`,
      ['pending']
    );
    
    res.json({ requests: result.rows });
  } catch (error: any) {
    console.error('Error fetching pending profile change requests:', error);
    res.status(500).json({ error: 'Failed to fetch pending profile change requests' });
  }
});

// Admin: Get all profile change requests (with filters)
router.get('/admin/all', verifyToken, async (req: Request, res: Response) => {
  try {
    // Check if user is admin
    if ((req as any).user.role !== 'Admin') {
      return res.status(403).json({ error: 'Only admins can view all profile change requests' });
    }
    
    const { status } = req.query;
    
    let queryText = `
      SELECT pcr.*, 
             u.full_name, u.email, u.role, u.region,
             reviewer.full_name as reviewed_by_name
      FROM profile_change_requests pcr
      JOIN users u ON pcr.user_id = u.id
      LEFT JOIN users reviewer ON pcr.reviewed_by = reviewer.id
    `;
    
    const params: any[] = [];
    if (status) {
      queryText += ' WHERE pcr.status = $1';
      params.push(status);
    }
    
    queryText += ' ORDER BY pcr.requested_at DESC';
    
    const result = await query(queryText, params);
    
    res.json({ requests: result.rows });
  } catch (error: any) {
    console.error('Error fetching all profile change requests:', error);
    res.status(500).json({ error: 'Failed to fetch profile change requests' });
  }
});

// Admin: Approve profile change request
router.post('/admin/approve/:requestId', verifyToken, async (req: Request, res: Response) => {
  try {
    // Check if user is admin
    if ((req as any).user.role !== 'Admin') {
      return res.status(403).json({ error: 'Only admins can approve profile change requests' });
    }
    
    const { requestId } = req.params;
    const adminId = (req as any).user.id;
    
    // Get the request
    const requestResult = await query(
      'SELECT * FROM profile_change_requests WHERE id = $1 AND status = $2',
      [requestId, 'pending']
    );
    
    if (requestResult.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found or already processed' });
    }
    
    const request = requestResult.rows[0];
    const requestedChanges = request.requested_changes;
    
    // Begin transaction
    await query('BEGIN');
    
    try {
      // Build update query dynamically based on requested changes
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramCount = 1;
      
      if (requestedChanges.full_name) {
        updateFields.push(`full_name = $${paramCount}`);
        updateValues.push(requestedChanges.full_name);
        paramCount++;
      }
      
      if (requestedChanges.email) {
        updateFields.push(`email = $${paramCount}`);
        updateValues.push(requestedChanges.email);
        paramCount++;
      }
      
      if (requestedChanges.region) {
        updateFields.push(`region = $${paramCount}`);
        updateValues.push(requestedChanges.region);
        paramCount++;
      }
      
      // Add updated_at
      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      
      // Update user profile
      updateValues.push(request.user_id);
      await query(
        `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramCount}`,
        updateValues
      );
      
      // Mark request as approved
      await query(
        `UPDATE profile_change_requests 
         SET status = $1, reviewed_by = $2, reviewed_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        ['approved', adminId, requestId]
      );
      
      await query('COMMIT');
      
      res.json({ 
        message: 'Profile change request approved and changes applied successfully',
        userId: request.user_id
      });
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (error: any) {
    console.error('Error approving profile change request:', error);
    res.status(500).json({ error: 'Failed to approve profile change request' });
  }
});

// Admin: Reject profile change request
router.post('/admin/reject/:requestId', verifyToken, async (req: Request, res: Response) => {
  try {
    // Check if user is admin
    if ((req as any).user.role !== 'Admin') {
      return res.status(403).json({ error: 'Only admins can reject profile change requests' });
    }
    
    const { requestId } = req.params;
    const { reason } = req.body;
    const adminId = (req as any).user.id;
    
    const result = await query(
      `UPDATE profile_change_requests 
       SET status = $1, reviewed_by = $2, reviewed_at = CURRENT_TIMESTAMP, rejection_reason = $3
       WHERE id = $4 AND status = $5
       RETURNING *`,
      ['rejected', adminId, reason || null, requestId, 'pending']
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found or already processed' });
    }
    
    res.json({ 
      message: 'Profile change request rejected successfully',
      request: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error rejecting profile change request:', error);
    res.status(500).json({ error: 'Failed to reject profile change request' });
  }
});

export default router;
