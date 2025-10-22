import cron from 'node-cron';
import { query } from '../db.js';
import { createNotification } from './notifications.js';

/**
 * Scheduler for automated deadline reminders
 * Runs daily at 9:00 AM to check for upcoming task deadlines
 */

export function startDeadlineReminders() {
  // Run every day at 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('🔔 Running deadline reminder check...');
    
    try {
      // Get tasks with deadlines in the next 24 hours
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(23, 59, 59, 999);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const result = await query(
        `SELECT t.id, t.title, t.deadline, t."assignedToId", 
                u.full_name, u.email,
                c.name as company_name
         FROM tasks t
         JOIN users u ON t."assignedToId" = u.id
         LEFT JOIN companies c ON t."companyId" = c.id
         WHERE t.deadline BETWEEN $1 AND $2 
           AND t.status != 'Completed'
         ORDER BY t.deadline ASC`,
        [today.toISOString(), tomorrow.toISOString()]
      );
      
      if (result.rows.length === 0) {
        console.log('✅ No upcoming deadlines found');
        return;
      }
      
      console.log(`📬 Found ${result.rows.length} tasks with upcoming deadlines`);
      
      // Create notifications for each task
      for (const task of result.rows) {
        const deadlineDate = new Date(task.deadline);
        const formattedDate = deadlineDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        
        const companyInfo = task.company_name ? ` for ${task.company_name}` : '';
        const message = `⏰ Deadline Alert: Task "${task.title}"${companyInfo} is due on ${formattedDate}`;
        
        await createNotification(task.assignedToId, message);
        console.log(`✉️  Sent reminder to ${task.full_name} for task "${task.title}"`);
      }
      
      console.log('✅ Deadline reminders sent successfully');
    } catch (error) {
      console.error('❌ Error sending deadline reminders:', error);
    }
  });
  
  console.log('✅ Deadline reminder scheduler started (runs daily at 9:00 AM)');
}

/**
 * Send overdue task notifications
 * Runs every day at 10:00 AM
 */
export function startOverdueTaskNotifications() {
  // Run every day at 10:00 AM
  cron.schedule('0 10 * * *', async () => {
    console.log('🔔 Checking for overdue tasks...');
    
    try {
      const now = new Date();
      
      const result = await query(
        `SELECT t.id, t.title, t.deadline, t."assignedToId",
                u.full_name, u.email,
                c.name as company_name
         FROM tasks t
         JOIN users u ON t."assignedToId" = u.id
         LEFT JOIN companies c ON t."companyId" = c.id
         WHERE t.deadline < $1 
           AND t.status != 'Completed'
         ORDER BY t.deadline ASC`,
        [now.toISOString()]
      );
      
      if (result.rows.length === 0) {
        console.log('✅ No overdue tasks found');
        return;
      }
      
      console.log(`⚠️  Found ${result.rows.length} overdue tasks`);
      
      for (const task of result.rows) {
        const companyInfo = task.company_name ? ` for ${task.company_name}` : '';
        const message = `🚨 OVERDUE: Task "${task.title}"${companyInfo} is past its deadline!`;
        
        await createNotification(task.assignedToId, message);
        console.log(`✉️  Sent overdue notice to ${task.full_name} for task "${task.title}"`);
      }
      
      console.log('✅ Overdue task notifications sent successfully');
    } catch (error) {
      console.error('❌ Error sending overdue notifications:', error);
    }
  });
  
  console.log('✅ Overdue task notification scheduler started (runs daily at 10:00 AM)');
}

/**
 * Initialize all schedulers
 */
export function initializeSchedulers() {
  startDeadlineReminders();
  startOverdueTaskNotifications();
  console.log('🚀 All schedulers initialized successfully');
}
