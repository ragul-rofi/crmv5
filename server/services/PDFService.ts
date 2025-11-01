import { query } from '../db.js';

export class PDFService {
  async generateCompanyReport(companyId: string) {
    const company = await query('SELECT * FROM companies WHERE id = $1', [companyId]);
    const contacts = await query('SELECT * FROM contacts WHERE company_id = $1', [companyId]);
    const tasks = await query('SELECT * FROM tasks WHERE company_id = $1', [companyId]);
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Company Report - ${company.rows[0]?.name}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { background: #f5f5f5; padding: 20px; margin-bottom: 20px; }
          .section { margin-bottom: 30px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Company Report</h1>
          <h2>${company.rows[0]?.name || 'Unknown Company'}</h2>
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="section">
          <h3>Company Details</h3>
          <table>
            <tr><th>Name</th><td>${company.rows[0]?.name || 'N/A'}</td></tr>
            <tr><th>Website</th><td>${company.rows[0]?.website || 'N/A'}</td></tr>
            <tr><th>Email</th><td>${company.rows[0]?.email || 'N/A'}</td></tr>
            <tr><th>Phone</th><td>${company.rows[0]?.phone || 'N/A'}</td></tr>
            <tr><th>Status</th><td>${company.rows[0]?.status || 'N/A'}</td></tr>
            <tr><th>Rating</th><td>${company.rows[0]?.rating || 'N/A'}</td></tr>
          </table>
        </div>
        
        <div class="section">
          <h3>Contacts (${contacts.rows.length})</h3>
          <table>
            <tr><th>Name</th><th>Email</th><th>Phone</th></tr>
            ${contacts.rows.map(contact => `
              <tr>
                <td>${contact.name}</td>
                <td>${contact.email || 'N/A'}</td>
                <td>${contact.phone || 'N/A'}</td>
              </tr>
            `).join('')}
          </table>
        </div>
        
        <div class="section">
          <h3>Tasks (${tasks.rows.length})</h3>
          <table>
            <tr><th>Title</th><th>Status</th><th>Deadline</th></tr>
            ${tasks.rows.map(task => `
              <tr>
                <td>${task.title}</td>
                <td>${task.status}</td>
                <td>${task.deadline ? new Date(task.deadline).toLocaleDateString() : 'N/A'}</td>
              </tr>
            `).join('')}
          </table>
        </div>
      </body>
      </html>
    `;
    
    return htmlContent;
  }

  async generateTaskReport(userId?: string) {
    let tasksQuery = `
      SELECT t.*, c.name as company_name, u.full_name as assigned_to
      FROM tasks t
      LEFT JOIN companies c ON t.company_id = c.id
      LEFT JOIN users u ON t.assigned_to_id = u.id
    `;
    let params: any[] = [];
    
    if (userId) {
      tasksQuery += ' WHERE t.assigned_to_id = $1';
      params.push(userId);
    }
    
    tasksQuery += ' ORDER BY t.created_at DESC';
    
    const tasks = await query(tasksQuery, params);
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Tasks Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { background: #f5f5f5; padding: 20px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .status-completed { color: green; font-weight: bold; }
          .status-inprogress { color: orange; font-weight: bold; }
          .status-notyet { color: red; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Tasks Report</h1>
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
          <p>Total Tasks: ${tasks.rows.length}</p>
        </div>
        
        <table>
          <tr>
            <th>Title</th>
            <th>Status</th>
            <th>Assigned To</th>
            <th>Company</th>
            <th>Deadline</th>
            <th>Created</th>
          </tr>
          ${tasks.rows.map(task => `
            <tr>
              <td>${task.title}</td>
              <td class="status-${task.status.toLowerCase()}">${task.status}</td>
              <td>${task.assigned_to || 'Unassigned'}</td>
              <td>${task.company_name || 'N/A'}</td>
              <td>${task.deadline ? new Date(task.deadline).toLocaleDateString() : 'N/A'}</td>
              <td>${new Date(task.created_at).toLocaleDateString()}</td>
            </tr>
          `).join('')}
        </table>
      </body>
      </html>
    `;
    
    return htmlContent;
  }

  async generateAnalyticsReport() {
    const [companies, tasks, tickets, users] = await Promise.all([
      query('SELECT COUNT(*) as count, status FROM companies GROUP BY status'),
      query('SELECT COUNT(*) as count, status FROM tasks GROUP BY status'),
      query('SELECT COUNT(*) as count, is_resolved FROM tickets GROUP BY is_resolved'),
      query('SELECT COUNT(*) as count, role FROM users GROUP BY role')
    ]);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Analytics Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { background: #f5f5f5; padding: 20px; margin-bottom: 20px; }
          .section { margin-bottom: 30px; }
          .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
          .stat-card { border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>CRM Analytics Report</h1>
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="section">
          <h3>Company Statistics</h3>
          <table>
            <tr><th>Status</th><th>Count</th></tr>
            ${companies.rows.map(row => `
              <tr><td>${row.status || 'Unknown'}</td><td>${row.count}</td></tr>
            `).join('')}
          </table>
        </div>
        
        <div class="section">
          <h3>Task Statistics</h3>
          <table>
            <tr><th>Status</th><th>Count</th></tr>
            ${tasks.rows.map(row => `
              <tr><td>${row.status}</td><td>${row.count}</td></tr>
            `).join('')}
          </table>
        </div>
        
        <div class="section">
          <h3>Ticket Statistics</h3>
          <table>
            <tr><th>Status</th><th>Count</th></tr>
            ${tickets.rows.map(row => `
              <tr><td>${row.is_resolved ? 'Resolved' : 'Open'}</td><td>${row.count}</td></tr>
            `).join('')}
          </table>
        </div>
        
        <div class="section">
          <h3>User Statistics</h3>
          <table>
            <tr><th>Role</th><th>Count</th></tr>
            ${users.rows.map(row => `
              <tr><td>${row.role}</td><td>${row.count}</td></tr>
            `).join('')}
          </table>
        </div>
      </body>
      </html>
    `;
    
    return htmlContent;
  }
}