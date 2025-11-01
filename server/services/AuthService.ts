import { query } from '../db.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

export class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  private readonly REFRESH_SECRET = process.env.REFRESH_SECRET || 'refresh-secret';
  private readonly ACCESS_TOKEN_EXPIRY = '15m';
  private readonly REFRESH_TOKEN_EXPIRY = '7d';

  async generateTokens(userId: string, role: string) {
    const accessToken = jwt.sign(
      { id: userId, role },
      this.JWT_SECRET,
      { expiresIn: this.ACCESS_TOKEN_EXPIRY }
    );

    const refreshToken = jwt.sign(
      { id: userId, type: 'refresh' },
      this.REFRESH_SECRET,
      { expiresIn: this.REFRESH_TOKEN_EXPIRY }
    );

    // Store refresh token in database
    await query(
      'UPDATE users SET refresh_token = $1, last_login = CURRENT_TIMESTAMP WHERE id = $2',
      [refreshToken, userId]
    );

    return { accessToken, refreshToken };
  }

  async refreshAccessToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, this.REFRESH_SECRET) as any;
      
      const user = await query(
        'SELECT id, role, refresh_token FROM users WHERE id = $1 AND refresh_token = $2',
        [decoded.id, refreshToken]
      );

      if (user.rows.length === 0) {
        throw new Error('Invalid refresh token');
      }

      const { accessToken, refreshToken: newRefreshToken } = await this.generateTokens(
        user.rows[0].id,
        user.rows[0].role
      );

      return { accessToken, refreshToken: newRefreshToken };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  async validatePassword(password: string): Promise<{ valid: boolean; message?: string }> {
    if (password.length < 8) {
      return { valid: false, message: 'Password must be at least 8 characters long' };
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return { valid: false, message: 'Password must contain at least one lowercase letter' };
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return { valid: false, message: 'Password must contain at least one uppercase letter' };
    }
    if (!/(?=.*\d)/.test(password)) {
      return { valid: false, message: 'Password must contain at least one number' };
    }
    if (!/(?=.*[@$!%*?&])/.test(password)) {
      return { valid: false, message: 'Password must contain at least one special character' };
    }
    return { valid: true };
  }

  async logSecurityEvent(userId: string, event: string, details: any, ipAddress?: string) {
    await query(
      'INSERT INTO security_logs (user_id, event, details, ip_address) VALUES ($1, $2, $3, $4)',
      [userId, event, JSON.stringify(details), ipAddress]
    );
  }

  async revokeAllTokens(userId: string) {
    await query('UPDATE users SET refresh_token = NULL WHERE id = $1', [userId]);
  }
}