import { Request, Response } from 'express';
import { CommentService } from '../services/CommentService.js';
import { AuthRequest } from '../auth.js';

const commentService = new CommentService();

export class CommentController {
  async getByEntity(req: Request, res: Response) {
    try {
      const { entityType, entityId } = req.params;
      const comments = await commentService.getByEntity(entityType, entityId);
      res.json(comments);
    } catch (error) {
      console.error('Get comments error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async create(req: AuthRequest, res: Response) {
    try {
      const comment = await commentService.create(req.body, req.user!.id);
      res.status(201).json(comment);
    } catch (error) {
      console.error('Create comment error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async update(req: AuthRequest, res: Response) {
    try {
      const { content } = req.body;
      const comment = await commentService.update(req.params.id, content, req.user!.id);
      if (!comment) {
        return res.status(404).json({ error: 'Comment not found or unauthorized' });
      }
      res.json(comment);
    } catch (error) {
      console.error('Update comment error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async delete(req: AuthRequest, res: Response) {
    try {
      const comment = await commentService.delete(req.params.id, req.user!.id);
      if (!comment) {
        return res.status(404).json({ error: 'Comment not found or unauthorized' });
      }
      res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
      console.error('Delete comment error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}