/**
 * Date Helper Utilities
 * 
 * Functions for formatting timestamps in a human-readable way
 */

import { Timestamp } from 'firebase/firestore';
import i18n from '../i18n';

/**
 * Convert Firestore Timestamp or Date to Date object
 */
function toDate(timestamp: Timestamp | Date): Date {
  if (timestamp instanceof Date) {
    return timestamp;
  }
  return timestamp.toDate();
}

/**
 * Format message time based on how recent it is
 * Examples: "Just now", "5m ago", "2h ago", "Yesterday", "Jan 15"
 * @param timestamp - Firestore Timestamp or Date
 * @returns Formatted time string
 */
export function formatMessageTime(timestamp: Timestamp | Date): string {
  const date = toDate(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  // Just now (< 1 minute)
  if (diffSeconds < 60) {
    return 'Just now';
  }
  
  // Minutes ago (< 1 hour)
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }
  
  // Hours ago (< 24 hours)
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  
  // Yesterday
  if (diffDays === 1) {
    return 'Yesterday';
  }
  
  // This week (< 7 days)
  if (diffDays < 7) {
    const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
    return weekday;
  }
  
  // This year
  const currentYear = now.getFullYear();
  const messageYear = date.getFullYear();
  
  if (currentYear === messageYear) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  
  // Different year
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
}

/**
 * Format time for message bubble (shows full time)
 * Example: "10:30 AM"
 * @param timestamp - Firestore Timestamp or Date
 * @returns Formatted time string
 */
export function formatBubbleTime(timestamp: Timestamp | Date): string {
  const date = toDate(timestamp);
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
}

/**
 * Format last seen time
 * Examples: "Online", "Active 5m ago", "Active yesterday"
 * @param lastSeen - Firestore Timestamp or Date
 * @param isOnline - Whether user is currently online
 * @returns Formatted status string
 */
export function formatLastSeen(lastSeen: Timestamp | Date, isOnline: boolean): string {
  if (isOnline) {
    return i18n.t('chat.online');
  }
  
  const date = toDate(lastSeen);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMinutes < 1) {
    return i18n.t('lastSeen.justNow');
  }
  
  if (diffMinutes < 60) {
    return i18n.t('lastSeen.minutesAgo', { minutes: diffMinutes });
  }
  
  if (diffHours < 24) {
    return i18n.t('lastSeen.hoursAgo', { hours: diffHours });
  }
  
  if (diffDays === 1) {
    return i18n.t('lastSeen.yesterday');
  }
  
  if (diffDays < 7) {
    return i18n.t('lastSeen.daysAgo', { days: diffDays });
  }
  
  return i18n.t('lastSeen.aWhileAgo');
}

/**
 * Group messages by date for rendering date separators
 * @param messages - Array of messages with timestamps
 * @returns Messages grouped by date string (e.g., "Today", "Yesterday", "Jan 15")
 */
export function groupMessagesByDate(
  messages: Array<{ timestamp: Timestamp | Date }>
): Record<string, Array<{ timestamp: Timestamp | Date }>> {
  const grouped: Record<string, Array<{ timestamp: Timestamp | Date }>> = {};
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  messages.forEach((message) => {
    const date = toDate(message.timestamp);
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    let dateKey: string;
    
    if (messageDate.getTime() === today.getTime()) {
      dateKey = 'Today';
    } else if (messageDate.getTime() === yesterday.getTime()) {
      dateKey = 'Yesterday';
    } else if (date.getFullYear() === now.getFullYear()) {
      dateKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
      dateKey = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    }
    
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    
    grouped[dateKey].push(message);
  });
  
  return grouped;
}

