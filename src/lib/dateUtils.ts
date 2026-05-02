import { Timestamp } from 'firebase/firestore';

export const APP_VERSION = '1.0.5';

/**
 * Safely converts a value to a Date object.
 * Handles Firestore Timestamps, serialized objects, numbers, and strings.
 */
export function safeToDate(timestamp: any): Date {
  try {
    if (!timestamp) return new Date();
    
    // If it's already a Date object
    if (timestamp instanceof Date) return timestamp;

    // Real Firestore Timestamp
    if (typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    }
    
    // Serialized Firestore Timestamp { seconds, nanoseconds }
    if (timestamp && typeof timestamp.seconds === 'number') {
      return new Timestamp(timestamp.seconds, timestamp.nanoseconds || 0).toDate();
    }
    
    // Number (milliseconds) or String (ISO)
    const date = new Date(timestamp);
    if (!isNaN(date.getTime())) return date;

    // Last resort fallback
    return new Date();
  } catch (e) {
    console.error('[DateUtils] Error converting timestamp:', timestamp, e);
    return new Date();
  }
}
export function getRelativeTime(timestamp: any): string {
  const date = safeToDate(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'agora';
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `há ${diffInMinutes} min`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `há ${diffInHours} h`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `há ${diffInDays} dias`;
  
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}
