import { query } from '../db.js';

export class EmailService {
  private emailQueue: any[] = [];

  async sendEmail(to: string, subject: string, body: string, type: 'html' | 'text' = 'html') {
    // In production, integrate with services like SendGrid, AWS SES, or Nodemailer
    const emailData = {
      to,
      subject,
      body,
      type,
      status: 'queued',
      created_at: new Date()
    };

    // Add to queue for processing
    this.emailQueue.push(emailData);

    // Log email to database
    const result = await query(
      'INSERT INTO email_logs (recipient, subject, body, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [to, subject, body, 'queued']
    );

    // Simulate email sending (replace with actual email service)
    setTimeout(() => {
      this.processEmailQueue();
    }, 1000);

    return result.rows[0];
  }

  async sendNotificationEmail(userId: string, subject: string, message: string) {
    const userResult = await query('SELECT email, full_name FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    if (!user?.email) {
      throw new Error('User email not found');
    }

    const emailBody = `
      <h2>Hello ${user.full_name},</h2>
      <p>${message}</p>
      <p>Best regards,<br>CRM System</p>
    `;

    return this.sendEmail(user.email, subject, emailBody);
  }

  async sendTaskAssignmentEmail(taskId: string, assignedToId: string) {
    const taskResult = await query(`
      SELECT t.title, t.description, u.email, u.full_name, c.name as company_name
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to_id = u.id
      LEFT JOIN companies c ON t.company_id = c.id
      WHERE t.id = $1
    `, [taskId]);

    const task = taskResult.rows[0];
    if (!task?.email) return;

    const subject = `New Task Assigned: ${task.title}`;
    const body = `
      <h2>Hello ${task.full_name},</h2>
      <p>You have been assigned a new task:</p>
      <h3>${task.title}</h3>
      <p><strong>Description:</strong> ${task.description || 'No description provided'}</p>
      ${task.company_name ? `<p><strong>Company:</strong> ${task.company_name}</p>` : ''}
      <p>Please log in to the CRM system to view more details.</p>
    `;

    return this.sendEmail(task.email, subject, body);
  }

  async sendTicketNotificationEmail(ticketId: string, assignedToId: string) {
    const ticketResult = await query(`
      SELECT t.title, t.description, u.email, u.full_name, c.name as company_name
      FROM tickets t
      LEFT JOIN users u ON t.assigned_to_id = u.id
      LEFT JOIN companies c ON t.company_id = c.id
      WHERE t.id = $1
    `, [ticketId]);

    const ticket = ticketResult.rows[0];
    if (!ticket?.email) return;

    const subject = `New Ticket Assigned: ${ticket.title}`;
    const body = `
      <h2>Hello ${ticket.full_name},</h2>
      <p>A new ticket has been assigned to you:</p>
      <h3>${ticket.title}</h3>
      <p><strong>Description:</strong> ${ticket.description}</p>
      ${ticket.company_name ? `<p><strong>Company:</strong> ${ticket.company_name}</p>` : ''}
      <p>Please log in to the CRM system to respond to this ticket.</p>
    `;

    return this.sendEmail(ticket.email, subject, body);
  }

  private async processEmailQueue() {
    // Process queued emails (simulate sending)
    while (this.emailQueue.length > 0) {
      const email = this.emailQueue.shift();
      
      try {
        // Simulate email sending delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Update status in database
        await query(
          'UPDATE email_logs SET status = $1, sent_at = CURRENT_TIMESTAMP WHERE recipient = $2 AND subject = $3',
          ['sent', email.to, email.subject]
        );
        
        console.log(`Email sent to ${email.to}: ${email.subject}`);
      } catch (error) {
        console.error('Failed to send email:', error);
        
        await query(
          'UPDATE email_logs SET status = $1, error_message = $2 WHERE recipient = $3 AND subject = $4',
          ['failed', error instanceof Error ? error.message : 'Unknown error', email.to, email.subject]
        );
      }
    }
  }

  async getEmailLogs(page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    const result = await query(`
      SELECT * FROM email_logs
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    const total = await query('SELECT COUNT(*) as total FROM email_logs');

    return {
      data: result.rows,
      pagination: {
        page,
        limit,
        total: parseInt(total.rows[0].total),
        pages: Math.ceil(parseInt(total.rows[0].total) / limit)
      }
    };
  }
}