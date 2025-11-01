import { Request, Response } from 'express';
import { PDFService } from '../services/PDFService.js';
import { AuthRequest } from '../auth.js';

const pdfService = new PDFService();

export class PDFController {
  async generateCompanyReport(req: Request, res: Response) {
    try {
      const { companyId } = req.params;
      const htmlContent = await pdfService.generateCompanyReport(companyId);
      
      // In production, use puppeteer or similar to convert HTML to PDF
      // For now, return HTML that can be printed as PDF
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `inline; filename="company-report-${companyId}.html"`);
      res.send(htmlContent);
    } catch (error) {
      console.error('Generate company report error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async generateTaskReport(req: AuthRequest, res: Response) {
    try {
      const userId = req.query.userId as string;
      const htmlContent = await pdfService.generateTaskReport(userId);
      
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', 'inline; filename="tasks-report.html"');
      res.send(htmlContent);
    } catch (error) {
      console.error('Generate task report error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async generateAnalyticsReport(req: Request, res: Response) {
    try {
      const htmlContent = await pdfService.generateAnalyticsReport();
      
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', 'inline; filename="analytics-report.html"');
      res.send(htmlContent);
    } catch (error) {
      console.error('Generate analytics report error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}