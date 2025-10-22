import { Router } from 'express';
import { query } from '../db.js';
import { verifyToken, AuthRequest } from '../auth.js';
import { enforceReadOnly, requireFinalizers, preventFinalizedEdit } from '../middleware/roleMiddleware.js';
import { validateRequest } from '../middleware/validation.js';
import { createCompanySchema, updateCompanySchema } from '../schemas/validation.js';

const router = Router();

// Get all companies (with role-based filtering)
router.get('/', verifyToken, async (req: AuthRequest, res) => {
  try {
    const role = req.user?.role;
    const userId = req.user?.id;
    
    let queryText = `
      SELECT c.*, 
             dc.full_name as data_collector_name,
             cv.full_name as converter_name,
             fb.full_name as finalized_by_name
      FROM companies c
      LEFT JOIN users dc ON c.assigned_data_collector_id = dc.id
      LEFT JOIN users cv ON c.assigned_converter_id = cv.id
      LEFT JOIN users fb ON c.finalized_by_id = fb.id
    `;
    
    const params: any[] = [];
    
    // DataCollector sees all companies (they manage all company data)
    // Converter sees only assigned companies
    if (role === 'Converter') {
      queryText += ' WHERE c.assigned_converter_id = $1';
      params.push(userId);
    }
    // Head and SubHead see only finalized companies
    else if (role === 'Head' || role === 'SubHead') {
      queryText += ' WHERE c.finalization_status = \'Finalized\'';
      // TODO: Add region filtering for SubHead
    }
    
    queryText += ' ORDER BY c.created_at DESC';
    
    const result = await query(queryText, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single company
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const result = await query('SELECT * FROM companies WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create company (Managers and DataCollectors)
router.post('/', verifyToken, enforceReadOnly, validateRequest(createCompanySchema), async (req: AuthRequest, res) => {
  try {
    const { name, website, phone, email, address, conversionStatus, customFields, assigned_data_collector_id, assigned_converter_id } = req.body;
    
    const result = await query(
      `INSERT INTO companies (
        name, website, phone, email, address, "conversionStatus", "customFields",
        assigned_data_collector_id, assigned_converter_id
      ) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        name, website, phone, email, address, 
        conversionStatus || 'Waiting', 
        customFields ? JSON.stringify(customFields) : null,
        assigned_data_collector_id || null,
        assigned_converter_id || null
      ]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create company error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update company (Managers and DataCollectors, cannot edit finalized)
// DataCollectors can update all company data
// Converters can update conversion status for their assigned companies
router.put('/:id', verifyToken, enforceReadOnly, preventFinalizedEdit, validateRequest(updateCompanySchema), async (req: AuthRequest, res) => {
  try {
    const { name, website, phone, email, address, conversionStatus, customFields, assigned_data_collector_id, assigned_converter_id } = req.body;
    const role = req.user?.role;
    const userId = req.user?.id;
    
    // Check if company exists
    const companyCheck = await query('SELECT * FROM companies WHERE id = $1', [req.params.id]);
    if (companyCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    const company = companyCheck.rows[0];
    
    // Check if company is finalized and user cannot edit finalized data
    if (req.preventFinalizedEdit) {
      if (company.finalization_status === 'Finalized') {
        return res.status(403).json({ 
          error: 'Cannot edit finalized company data',
          hint: 'Only Admin can edit finalized records'
        });
      }
    }
    
    // DataCollector can update all companies (no restrictions on conversion status)
    // They manage all company data
    
    // Converter can only update conversion status for their assigned companies
    if (role === 'Converter') {
      if (company.assigned_converter_id !== userId) {
        return res.status(403).json({ 
          error: 'You can only update companies assigned to you'
        });
      }
      // Only allow updating conversion status
      const allowedFields = ['conversionStatus'];
      const providedFields = Object.keys(req.body);
      const disallowedFields = providedFields.filter(f => !allowedFields.includes(f));
      
      if (disallowedFields.length > 0) {
        return res.status(403).json({ 
          error: 'Converters can only update conversion status',
          hint: `Cannot update: ${disallowedFields.join(', ')}` 
        });
      }
    }
    
    const result = await query(
      `UPDATE companies 
       SET name = $1, website = $2, phone = $3, email = $4, address = $5, 
           "conversionStatus" = $6, "customFields" = $7,
           assigned_data_collector_id = $8, assigned_converter_id = $9,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $10 RETURNING *`,
      [
        name, website, phone, email, address, conversionStatus, 
        customFields ? JSON.stringify(customFields) : null,
        assigned_data_collector_id,
        assigned_converter_id,
        req.params.id
      ]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update company error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete company (Managers and DataCollectors, cannot delete finalized)
router.delete('/:id', verifyToken, enforceReadOnly, preventFinalizedEdit, async (req: AuthRequest, res) => {
  try {
    // Check if company is finalized
    if (req.preventFinalizedEdit) {
      const checkResult = await query('SELECT finalization_status FROM companies WHERE id = $1', [req.params.id]);
      if (checkResult.rows.length > 0 && checkResult.rows[0].finalization_status === 'Finalized') {
        return res.status(403).json({ 
          error: 'Cannot delete finalized company data',
          hint: 'Only Admin can delete finalized records'
        });
      }
    }
    const result = await query('DELETE FROM companies WHERE id = $1 RETURNING *', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    res.json({ message: 'Company deleted successfully' });
  } catch (error) {
    console.error('Delete company error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Finalize company data (Admin and Manager only)
router.put('/:id/finalize', verifyToken, requireFinalizers, async (req: AuthRequest, res) => {
  try {
    // Check if company exists and has Confirmed status
    const checkResult = await query(
      'SELECT * FROM companies WHERE id = $1',
      [req.params.id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    const company = checkResult.rows[0];
    
    if (company.conversionStatus !== 'Confirmed') {
      return res.status(400).json({ 
        error: 'Can only finalize confirmed data',
        currentStatus: company.conversionStatus
      });
    }
    
    if (company.finalization_status === 'Finalized') {
      return res.status(400).json({ error: 'Company data already finalized' });
    }
    
    // Finalize the company
    const result = await query(
      `UPDATE companies 
       SET finalization_status = 'Finalized', 
           finalized_by_id = $1, 
           finalized_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [req.user!.id, req.params.id]
    );
    
    res.json({
      message: 'Company data finalized successfully',
      company: result.rows[0]
    });
  } catch (error) {
    console.error('Finalize company error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get finalized companies (for Head/SubHead)
router.get('/finalized/list', verifyToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT c.*, u.full_name as finalized_by_name
       FROM companies c
       LEFT JOIN users u ON c.finalized_by_id = u.id
       WHERE c.finalization_status = 'Finalized'
       ORDER BY c.finalized_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get finalized companies error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
