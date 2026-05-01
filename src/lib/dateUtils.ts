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
