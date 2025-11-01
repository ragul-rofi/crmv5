import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { safeLog } from './utils/logger.js';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

let io: Server;

export const initializeSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: process.env.NODE_ENV === 'development' 
        ? ['http://localhost:3000', 'http://127.0.0.1:3000'] 
        : true,
      credentials: true
    }
  });

  // Authentication middleware
  io.use((socket: any, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    safeLog.info('User connected to socket', { userId: socket.userId });

    // Join user to their own room for targeted notifications
    socket.join(`user:${socket.userId}`);

    // Join role-based rooms
    if (socket.userRole) {
      socket.join(`role:${socket.userRole}`);
    }

    socket.on('disconnect', () => {
      safeLog.info('User disconnected from socket', { userId: socket.userId });
    });
  });

  return io;
};

export const getSocketIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

// Notification functions
export const notifyUser = (userId: string, notification: any) => {
  if (io) {
    io.to(`user:${userId}`).emit('notification', notification);
  }
};

export const notifyRole = (role: string, notification: any) => {
  if (io) {
    io.to(`role:${role}`).emit('notification', notification);
  }
};

export const broadcastUpdate = (event: string, data: any) => {
  if (io) {
    io.emit(event, data);
  }
};

// Specific notification helpers
export const notifyFileUploaded = (userId: string, filename: string, entityType: string) => {
  if (io) {
    io.to(`user:${userId}`).emit('fileUploaded', { filename, entityType });
  }
};

export const notifyNewComment = (userId: string, authorName: string, content: string, entityType: string) => {
  if (io) {
    io.to(`user:${userId}`).emit('newComment', { authorName, content, entityType });
  }
};

export const notifyTaskAssigned = (userId: string, title: string) => {
  if (io) {
    io.to(`user:${userId}`).emit('taskAssigned', { title });
  }
};

export const notifyTicketAssigned = (userId: string, title: string) => {
  if (io) {
    io.to(`user:${userId}`).emit('ticketAssigned', { title });
  }
};