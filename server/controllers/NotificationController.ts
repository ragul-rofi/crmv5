import { Request, Response } from 'express';
import { NotificationService } from '../services/NotificationService.js';
import { AuthRequest } from '../auth.js';

const notificationService = new NotificationService();

export class NotificationController {
  async getMyNotifications(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
      
      const result = await notificationService.getByUser(req.user!.id, page, limit);
      res.json(result);
    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getUnreadCount(req: AuthRequest, res: Response) {
    try {
      const count = await notificationService.getUnreadCount(req.user!.id);
      res.json({ count });
    } catch (error) {
      console.error('Get unread count error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async markAsRead(req: AuthRequest, res: Response) {
    try {
      const notification = await notificationService.markAsRead(req.params.id, req.user!.id);
      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }
      res.json(notification);
    } catch (error) {
      console.error('Mark as read error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async markAllAsRead(req: AuthRequest, res: Response) {
    try {
      const count = await notificationService.markAllAsRead(req.user!.id);
      res.json({ message: `${count} notifications marked as read` });
    } catch (error) {
      console.error('Mark all as read error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async delete(req: AuthRequest, res: Response) {
    try {
      const notification = await notificationService.delete(req.params.id, req.user!.id);
      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }
      res.json({ message: 'Notification deleted successfully' });
    } catch (error) {
      console.error('Delete notification error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}