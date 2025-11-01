import { Router } from 'express';
import { query } from '../../db.js';
import { verifyToken } from '../../auth.js';

const router = Router();

// Global search
router.get('/', verifyToken, async (req, res) => {
  try {
    const searchTerm = req.query.q as string;
    if (!searchTerm || searchTerm.length < 2) {
      return res.json({ companies: [], contacts: [], tasks: [], tickets: [], users: [] });
    }

    const searchPattern = `%${searchTerm}%`;

    const [companies, contacts, tasks, tickets, users] = await Promise.all([
      query(`
        SELECT id, name, website, email, 'company' as type
        FROM companies
        WHERE name ILIKE $1 OR email ILIKE $1 OR website ILIKE $1
        LIMIT 10
      `, [searchPattern]),
      
      query(`
        SELECT c.id, c.name, c.email, c.phone, c.company_id, co.name as company_name, 'contact' as type
        FROM contacts c
        LEFT JOIN companies co ON c.company_id = co.id
        WHERE c.name ILIKE $1 OR c.email ILIKE $1 OR c.phone ILIKE $1
        LIMIT 10
      `, [searchPattern]),
      
      query(`
        SELECT t.id, t.title, t.description, u.full_name as assigned_to, 'task' as type
        FROM tasks t
        LEFT JOIN users u ON t.assigned_to_id = u.id
        WHERE t.title ILIKE $1 OR t.description ILIKE $1
        LIMIT 10
      `, [searchPattern]),
      
      query(`
        SELECT t.id, t.title, t.description, u.full_name as assigned_to, 'ticket' as type
        FROM tickets t
        LEFT JOIN users u ON t.assigned_to_id = u.id
        WHERE t.title ILIKE $1 OR t.description ILIKE $1
        LIMIT 10
      `, [searchPattern]),
      
      query(`
        SELECT id, full_name, email, role, 'user' as type
        FROM users
        WHERE full_name ILIKE $1 OR email ILIKE $1
        LIMIT 10
      `, [searchPattern])
    ]);

    res.json({
      companies: companies.rows,
      contacts: contacts.rows,
      tasks: tasks.rows,
      tickets: tickets.rows,
      users: users.rows
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search companies
router.get('/companies', verifyToken, async (req, res) => {
  try {
    const searchTerm = req.query.q as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const offset = (page - 1) * limit;

    if (!searchTerm || searchTerm.length < 2) {
      return res.json({ data: [], pagination: { page, limit, total: 0, pages: 0 } });
    }

    const searchPattern = `%${searchTerm}%`;

    const [results, countResult] = await Promise.all([
      query(`
        SELECT * FROM companies
        WHERE name ILIKE $1 OR email ILIKE $1 OR website ILIKE $1 OR industry ILIKE $1
        ORDER BY name
        LIMIT $2 OFFSET $3
      `, [searchPattern, limit, offset]),
      
      query(`
        SELECT COUNT(*) as total FROM companies
        WHERE name ILIKE $1 OR email ILIKE $1 OR website ILIKE $1 OR industry ILIKE $1
      `, [searchPattern])
    ]);

    const total = parseInt(countResult.rows[0].total);

    res.json({
      data: results.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Search companies error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;