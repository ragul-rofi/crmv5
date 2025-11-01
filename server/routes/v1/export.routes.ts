import { Router } from 'express';
import { query } from '../../db.js';
import { verifyToken } from '../../auth.js';
import { requireManagers } from '../../middleware/roleMiddleware.js';
import * as XLSX from 'xlsx';

const router = Router();

// Export companies
router.get('/companies', verifyToken, requireManagers, async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        name, website, phone, email, address, industry,
        conversion_status AS "conversionStatus",
        status, rating, created_at
      FROM companies
      ORDER BY created_at DESC
    `);

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(result.rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Companies');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=companies.xlsx');
    res.send(buffer);
  } catch (error) {
    console.error('Export companies error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Export finalized companies only
router.get('/companies/finalized', verifyToken, requireManagers, async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        name, website, phone, email, address, industry,
        conversion_status AS "conversionStatus",
        status, rating, created_at
      FROM companies
      WHERE finalization_status = 'Finalized'
      ORDER BY created_at DESC
    `);

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(result.rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Finalized Companies');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=finalized_companies.xlsx');
    res.send(buffer);
  } catch (error) {
    console.error('Export finalized companies error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Export tasks
router.get('/tasks', verifyToken, requireManagers, async (req, res) => {
  try {
    const result = await query(`
      SELECT t.title, t.description, t.status, t.deadline,
             u.full_name as assigned_to, c.name as company_name,
             t.created_at
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to_id = u.id
      LEFT JOIN companies c ON t.company_id = c.id
      ORDER BY t.created_at DESC
    `);

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(result.rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tasks');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=tasks.xlsx');
    res.send(buffer);
  } catch (error) {
    console.error('Export tasks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Export tickets
router.get('/tickets', verifyToken, requireManagers, async (req, res) => {
  try {
    const result = await query(`
      SELECT t.title, t.description, t.is_resolved,
             u1.full_name as raised_by, u2.full_name as assigned_to,
             c.name as company_name, t.created_at
      FROM tickets t
      LEFT JOIN users u1 ON t.raised_by_id = u1.id
      LEFT JOIN users u2 ON t.assigned_to_id = u2.id
      LEFT JOIN companies c ON t.company_id = c.id
      ORDER BY t.created_at DESC
    `);

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(result.rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tickets');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=tickets.xlsx');
    res.send(buffer);
  } catch (error) {
    console.error('Export tickets error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;