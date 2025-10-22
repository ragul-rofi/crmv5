import { query } from '../db.js';

/**
 * Create a notification for a user
 */
export async function createNotification(userId: string, message: string): Promise<void> {
  try {
    await query(
      'INSERT INTO notifications ("userId", message) VALUES ($1, $2)',
      [userId, message]
    );
    console.log(`✅ Notification created for user ${userId}`);
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}

/**
 * Notify user when a task is assigned to them
 */
export async function notifyTaskAssigned(
  assignedToId: string, 
  title: string, 
  assignedByName: string
): Promise<void> {
  const message = `${assignedByName} assigned you a new task: "${title}"`;
  await createNotification(assignedToId, message);
}

/**
 * Notify user when a task deadline is approaching
 */
export async function notifyDeadlineApproaching(
  assignedToId: string, 
  title: string, 
  deadline: Date
): Promise<void> {
  const message = `Task "${title}" deadline is approaching: ${deadline.toLocaleDateString()}`;
  await createNotification(assignedToId, message);
}

/**
 * Notify user when a ticket is raised and assigned to them
 */
export async function notifyTicketRaised(
  assignedToId: string, 
  title: string, 
  raisedByName: string,
  companyName?: string
): Promise<void> {
  const companyInfo = companyName ? ` for ${companyName}` : '';
  const message = `${raisedByName} raised a ticket${companyInfo}: "${title}" and assigned it to you`;
  await createNotification(assignedToId, message);
}

/**
 * Notify user when a ticket is resolved
 */
export async function notifyTicketResolved(
  raisedById: string, 
  title: string, 
  resolvedByName: string
): Promise<void> {
  const message = `${resolvedByName} resolved your ticket: "${title}"`;
  await createNotification(raisedById, message);
}

/**
 * Notify user when a task is updated
 */
export async function notifyTaskUpdated(
  assignedToId: string, 
  title: string, 
  updatedByName: string
): Promise<void> {
  const message = `${updatedByName} updated task: "${title}"`;
  await createNotification(assignedToId, message);
}
