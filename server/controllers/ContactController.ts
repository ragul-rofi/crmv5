import { Request, Response } from 'express';
import { ContactService } from '../services/ContactService.js';
import { AuthRequest } from '../auth.js';

const contactService = new ContactService();

export class ContactController {
  async getAll(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const companyId = req.query.companyId as string | undefined;
      
      const result = await contactService.getAll(page, limit, companyId);
      res.json(result);
    } catch (error) {
      console.error('Get contacts error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async create(req: AuthRequest, res: Response) {
    try {
      const contact = await contactService.create(req.body);
      res.status(201).json(contact);
    } catch (error) {
      console.error('Create contact error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const contact = await contactService.update(req.params.id, req.body);
      if (!contact) {
        return res.status(404).json({ error: 'Contact not found' });
      }
      res.json(contact);
    } catch (error) {
      console.error('Update contact error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const contact = await contactService.delete(req.params.id);
      if (!contact) {
        return res.status(404).json({ error: 'Contact not found' });
      }
      res.json({ message: 'Contact deleted successfully' });
    } catch (error) {
      console.error('Delete contact error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}