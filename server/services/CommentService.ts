import { BaseService } from './BaseService.js';
import { query } from '../db.js';

export class CommentService extends BaseService {
  async getByEntity(entityType: string, entityId: string) {
    const comments = await query(`
      SELECT c.*, u.full_name as author_name
      FROM comments c
      LEFT JOIN users u ON c."authorId" = u.id
      WHERE c."entityType" = $1 AND c."entityId" = $2
      ORDER BY c.created_at ASC
    `, [entityType, entityId]);
    
    return comments.rows;
  }

  async create(data: any, authorId: string) {
    const { content, entityType, entityId } = data;
    const result = await query(
      'INSERT INTO comments (content, "entityType", "entityId", "authorId") VALUES ($1, $2, $3, $4) RETURNING *',
      [content, entityType, entityId, authorId]
    );
    return result.rows[0];
  }

  async update(id: string, content: string, authorId: string) {
    const result = await query(
      'UPDATE comments SET content = $1 WHERE id = $2 AND "authorId" = $3 RETURNING *',
      [content, id, authorId]
    );
    return result.rows[0];
  }

  async delete(id: string, authorId: string) {
    const result = await query(
      'DELETE FROM comments WHERE id = $1 AND "authorId" = $2 RETURNING *',
      [id, authorId]
    );
    return result.rows[0];
  }
}