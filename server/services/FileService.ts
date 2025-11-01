import { query } from '../db.js';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export class FileService {
  private uploadDir = 'uploads';

  async uploadFile(file: any, entityType: string, entityId: string, uploadedBy: string) {
    // Ensure upload directory exists
    await mkdir(this.uploadDir, { recursive: true });
    
    const fileId = uuidv4();
    const fileName = `${fileId}_${file.originalname}`;
    const filePath = join(this.uploadDir, fileName);
    
    // Save file to disk
    await writeFile(filePath, file.buffer);
    
    // Save file record to database
    const result = await query(
      `INSERT INTO file_attachments (id, filename, original_name, file_path, file_size, mime_type, entity_type, entity_id, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [fileId, fileName, file.originalname, filePath, file.size, file.mimetype, entityType, entityId, uploadedBy]
    );
    
    return result.rows[0];
  }

  async getFilesByEntity(entityType: string, entityId: string) {
    const result = await query(
      `SELECT f.*, u.full_name as uploaded_by_name
       FROM file_attachments f
       LEFT JOIN users u ON f.uploaded_by = u.id
       WHERE f.entity_type = $1 AND f.entity_id = $2
       ORDER BY f.created_at DESC`,
      [entityType, entityId]
    );
    return result.rows;
  }

  async deleteFile(fileId: string, userId: string) {
    const result = await query(
      'DELETE FROM file_attachments WHERE id = $1 AND uploaded_by = $2 RETURNING *',
      [fileId, userId]
    );
    return result.rows[0];
  }

  async getFile(fileId: string) {
    const result = await query('SELECT * FROM file_attachments WHERE id = $1', [fileId]);
    return result.rows[0];
  }
}