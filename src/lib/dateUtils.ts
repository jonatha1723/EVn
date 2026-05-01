import { Timestamp } from 'firebase/firestore';

/**
 * Safely converts a value to a Date object.
 * Handles Firestore Timestamps, serialized objects, numbers, and strings.
 */
export function safeToDate(timestamp: any): Date {
  if (!timestamp) return new Date();
  
  // Real Firestore Timestamp
  if (typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  
  // Serialized Firestore Timestamp { seconds, nanoseconds }
  if (typeof timestamp.seconds === 'number') {
    return new Timestamp(timestamp.seconds, timestamp.nanoseconds || 0).toDate();
  }
  
  // Number (millseconds) or String (ISO)
  const date = new Date(timestamp);
  return isNaN(date.getTime()) ? new Date() : date;
}
