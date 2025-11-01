import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../../db.js';

import { generateToken } from '../../auth.js';
import { validateRequest } from '../../middleware/validation.js';
import { loginSchema, signupSchema } from '../../schemas/validation.js';
import { safeLog } from '../../utils/logger.js';
import { sendSuccess, sendError } from '../../utils/standardResponse.js';

const JWT_SECRET = process.env.JWT_SECRET;

const router = Router();

// Simple login endpoint
router.post('/login', validateRequest(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return sendError(res, 'Invalid credentials', 401);
    }

    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return sendError(res, 'Invalid credentials', 401);
    }

    const token = generateToken(user.id, user.email, user.role);

    return sendSuccess(res, {
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return sendError(res, 'Login failed', 500);
  }
});

// Signup - simplified without middleware for now
router.post('/signup', validateRequest(signupSchema), async (req, res) => {
  try {
    const { email, password, full_name, role } = req.body;

    // Check if user exists
    const existingUser = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return sendError(res, 'User already exists', 400);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const result = await query(
      'INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, $4) RETURNING *',
      [email, passwordHash, full_name, role || 'DataCollector']
    );

    const user = result.rows[0];
    const token = generateToken(user.id, user.email, user.role);

    return sendSuccess(res, {
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
    }, undefined, 201);
  } catch (error) {
    safeLog.error('Signup error:', error);
    return sendError(res, 'Internal server error', 500);
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return sendError(res, 'No token provided', 401);
    }

    if (!JWT_SECRET) throw new Error('JWT_SECRET environment variable is not set');
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    const result = await query('SELECT id, email, full_name, role FROM users WHERE id = $1', [decoded.id]);
    
    if (result.rows.length === 0) {
      return sendError(res, 'User not found', 404);
    }

    return sendSuccess(res, result.rows[0]);
  } catch (error) {
    safeLog.error('Get user error:', error);
    return sendError(res, 'Invalid token', 401);
  }
});

export default router;