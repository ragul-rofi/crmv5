import { Request, Response } from 'express';
import { TicketService } from '../services/TicketService.js';
import { AuthRequest } from '../auth.js';

const ticketService = new TicketService();

export class TicketController {
  async getAll(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const companyId = req.query.companyId as string | undefined;
      
      const result = await ticketService.getAll(page, limit, companyId);
      res.json(result);
    } catch (error) {
      console.error('Get tickets error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getMyTickets(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
      
      const result = await ticketService.getByUser(req.user!.id, page, limit);
      res.json(result);
    } catch (error) {
      console.error('Get my tickets error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getMyTicketsCount(req: AuthRequest, res: Response) {
    try {
      const count = await ticketService.getOpenCount(req.user!.id);
      res.json({ count });
    } catch (error) {
      console.error('Get my tickets count error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async create(req: AuthRequest, res: Response) {
    try {
      const ticket = await ticketService.create(req.body, req.user!.id);
      res.status(201).json(ticket);
    } catch (error) {
      console.error('Create ticket error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const ticket = await ticketService.update(req.params.id, req.body);
      if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found' });
      }
      res.json(ticket);
    } catch (error) {
      console.error('Update ticket error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const ticket = await ticketService.delete(req.params.id);
      if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found' });
      }
      res.json({ message: 'Ticket deleted successfully' });
    } catch (error) {
      console.error('Delete ticket error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}