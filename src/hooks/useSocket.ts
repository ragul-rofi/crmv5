import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Initialize socket connection
    socketRef.current = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      auth: {
        token: localStorage.getItem('token')
      }
    });

    const socket = socketRef.current;

    // Connection events
    socket.on('connect', () => {
      console.log('Socket connected');
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    // Real-time notifications
    socket.on('notification', (data) => {
      toast.info(data.message, {
        description: data.description,
        duration: 5000
      });
    });

    // File upload notifications
    socket.on('fileUploaded', (data) => {
      toast.success(`File uploaded: ${data.filename}`, {
        description: `Uploaded to ${data.entityType}`,
        duration: 3000
      });
    });

    // Comment notifications
    socket.on('newComment', (data) => {
      toast.info(`New comment on ${data.entityType}`, {
        description: `${data.authorName}: ${data.content.substring(0, 50)}...`,
        duration: 4000
      });
    });

    // Task assignment notifications
    socket.on('taskAssigned', (data) => {
      toast.success('New task assigned', {
        description: data.title,
        duration: 5000
      });
    });

    // Ticket notifications
    socket.on('ticketAssigned', (data) => {
      toast.info('New ticket assigned', {
        description: data.title,
        duration: 5000
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  return socketRef.current;
};