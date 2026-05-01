import { useEffect, useRef, useState, useCallback } from 'react';
import { User } from 'firebase/auth';
import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { UserData } from '../types';

export const useSocket = (user: User | null, activeContact: UserData | null) => {
  const [isContactTyping, setIsContactTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activeContactRef = useRef<UserData | null>(null);
  const lastTypingEmitRef = useRef<number>(0);

  useEffect(() => {
    activeContactRef.current = activeContact;
    setIsContactTyping(false);
  }, [activeContact]);

  // Listen for typing status from the active contact via Firestore
  useEffect(() => {
    if (!user || !activeContact) return;

    const chatId = [user.uid, activeContact.uid].sort().join('_');
    const typingDocRef = doc(db, 'typing', chatId);

    const unsub = onSnapshot(typingDocRef, (snap) => {
      if (!snap.exists()) {
        setIsContactTyping(false);
        return;
      }

      const data = snap.data();
      const contactTypingField = data?.[activeContact.uid];

      if (contactTypingField && typeof contactTypingField === 'object') {
        const isTyping = contactTypingField.isTyping === true;
        const updatedAt = contactTypingField.updatedAt?.toMillis?.() || 0;
        // Consider typing status stale after 5 seconds
        const isRecent = Date.now() - updatedAt < 5000;
        setIsContactTyping(isTyping && isRecent);
      } else {
        setIsContactTyping(false);
      }
    }, (error) => {
      // Silently handle permission errors on non-existent docs
      console.warn('Typing listener error:', error.code);
    });

    return () => unsub();
  }, [user, activeContact]);

  const setTypingStatus = useCallback(async (isTyping: boolean) => {
    if (!user || !activeContact) return;

    const now = Date.now();
    // Throttle: only emit 'true' if it's been > 2 seconds since last
    if (isTyping && now - lastTypingEmitRef.current < 2000) {
      // Still reset the auto-clear timeout
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setTypingStatus(false);
        typingTimeoutRef.current = null;
      }, 3000);
      return;
    }

    if (isTyping) lastTypingEmitRef.current = now;

    const chatId = [user.uid, activeContact.uid].sort().join('_');
    const typingDocRef = doc(db, 'typing', chatId);

    try {
      await setDoc(typingDocRef, {
        [user.uid]: {
          isTyping,
          updatedAt: serverTimestamp()
        }
      }, { merge: true });
    } catch (error) {
      // Silently ignore typing update errors (non-critical feature)
      console.warn('Typing update error:', error);
    }

    if (isTyping) {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setTypingStatus(false);
        typingTimeoutRef.current = null;
      }, 3000);
    }
  }, [user, activeContact]);

  return { isContactTyping, setTypingStatus };
};
