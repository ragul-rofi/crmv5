import { Request, Response } from 'express';
import { FileService } from '../services/FileService.js';
import { AuthRequest } from '../auth.js';
import { readFile } from 'fs/promises';

const fileService = new FileService();

export class FileController {
  async uploadFile(req: AuthRequest, res: Response) {
    try {
      const { entityType, entityId } = req.body;
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ error: 'No file provided' });
      }
      
      const result = await fileService.uploadFile(file, entityType, entityId, req.user!.id);
      res.status(201).json(result);
    } catch (error) {
      console.error('Upload file error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getFilesByEntity(req: Request, res: Response) {
    try {
      const { entityType, entityId } = req.params;
      const files = await fileService.getFilesByEntity(entityType, entityId);
      res.json(files);
    } catch (error) {
      console.error('Get files error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async downloadFile(req: Request, res: Response) {
    try {
      const { fileId } = req.params;
      const file = await fileService.getFile(fileId);
      
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }
      
      const fileBuffer = await readFile(file.file_path);
      
      res.setHeader('Content-Type', file.mime_type);
      res.setHeader('Content-Disposition', `attachment; filename="${file.original_name}"`);
      res.send(fileBuffer);
    } catch (error) {
      console.error('Download file error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async deleteFile(req: AuthRequest, res: Response) {
    try {
      const { fileId } = req.params;
      const result = await fileService.deleteFile(fileId, req.user!.id);
      
      if (!result) {
        return res.status(404).json({ error: 'File not found or unauthorized' });
      }
      
      res.json({ message: 'File deleted successfully' });
    } catch (error) {
      console.error('Delete file error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}