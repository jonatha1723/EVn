import { useEffect, useRef, useState } from 'react';
import { User } from 'firebase/auth';
import { io, Socket } from 'socket.io-client';
import { UserData } from '../types';

export const useSocket = (user: User | null, activeContact: UserData | null) => {
  const socketRef = useRef<Socket | null>(null);
  const [isContactTyping, setIsContactTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activeContactRef = useRef<UserData | null>(null);

  useEffect(() => {
    activeContactRef.current = activeContact;
    setIsContactTyping(false);
  }, [activeContact]);

  useEffect(() => {
    if (!user) return;

    console.log('Initializing Socket.io connection to:', window.location.origin);

    const socket = io(window.location.origin, {
      path: '/socket.io',
      transports: ['polling'],
      upgrade: false,
      reconnectionAttempts: 20,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 60000,
      forceNew: true,
      autoConnect: true,
      withCredentials: true
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected successfully!', { id: socket.id, transport: socket.io.engine.transport.name });
      socket.emit('join_room', user.uid);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message, err.stack);
    });

    socket.on('disconnect', (reason) => {
      console.warn('Socket disconnected:', reason);
      if (reason === 'io server disconnect') {
        // the disconnection was initiated by the server, you need to reconnect manually
        socket.connect();
      }
    });

    socket.on('typing_status', (data: { senderId: string; isTyping: boolean }) => {
      if (activeContactRef.current?.uid === data.senderId) {
        setIsContactTyping(data.isTyping);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  const lastTypingEmitRef = useRef<number>(0);

  const setTypingStatus = async (isTyping: boolean) => {
    if (!user || !activeContact || !socketRef.current) return;

    const now = Date.now();
    // Only emit 'true' if it's been more than 2 seconds since the last 'true' emit
    if (isTyping && now - lastTypingEmitRef.current < 2000) {
      // Still reset the timeout to clear the status
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        if (socketRef.current) {
          socketRef.current.emit('typing_status', {
            senderId: user.uid,
            receiverId: activeContact.uid,
            isTyping: false
          });
        }
        typingTimeoutRef.current = null;
      }, 3000);
      return;
    }

    if (isTyping) lastTypingEmitRef.current = now;

    socketRef.current.emit('typing_status', {
      senderId: user.uid,
      receiverId: activeContact.uid,
      isTyping
    });

    if (isTyping) {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        if (socketRef.current) {
          socketRef.current.emit('typing_status', {
            senderId: user.uid,
            receiverId: activeContact.uid,
            isTyping: false
          });
        }
        typingTimeoutRef.current = null;
      }, 3000);
    }
  };

  return { isContactTyping, setTypingStatus };
};
