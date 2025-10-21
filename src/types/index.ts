/**
 * Core TypeScript type definitions for WK2 MessageAI
 */

import { Timestamp } from 'firebase/firestore';

/**
 * User interface matching Firestore users collection
 */
export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
  isOnline: boolean;
  lastSeen: Timestamp | Date;
  pushToken?: string | null;
  createdAt: Timestamp | Date;
}

/**
 * Chat type - either direct (1-on-1) or group
 */
export type ChatType = 'direct' | 'group';

/**
 * Chat interface matching Firestore chats collection
 */
export interface Chat {
  id: string;
  type: ChatType;
  participants: string[]; // Array of user IDs
  lastMessage: string;
  lastMessageTime: Timestamp | Date;
  createdAt: Timestamp | Date;
  groupName?: string; // Only for group chats
  groupPhoto?: string; // Only for group chats
}

/**
 * Message interface matching Firestore messages subcollection
 */
export interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: Timestamp | Date;
  readBy: string[]; // Array of user IDs who have read the message
  pending?: boolean; // For optimistic updates
  failed?: boolean; // For failed message send
  tempId?: string; // Temporary ID for optimistic updates
}

/**
 * UserChat interface for userChats subcollection
 * Tracks per-user chat metadata
 */
export interface UserChat {
  chatId: string;
  unreadCount: number;
  lastViewed: Timestamp | Date;
}

/**
 * Enhanced Chat for UI display with additional computed properties
 */
export interface ChatWithDetails extends Chat {
  otherUserName?: string; // For direct chats
  otherUserOnline?: boolean; // For direct chats
  otherUserLastSeen?: Date; // For direct chats (converted from Timestamp)
  unreadCount?: number;
}

/**
 * Auth state
 */
export interface AuthState {
  user: User | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Error codes for better error handling
 */
export enum ErrorCode {
  AUTH_INVALID_EMAIL = 'auth/invalid-email',
  AUTH_USER_NOT_FOUND = 'auth/user-not-found',
  AUTH_WRONG_PASSWORD = 'auth/wrong-password',
  AUTH_EMAIL_IN_USE = 'auth/email-already-in-use',
  AUTH_WEAK_PASSWORD = 'auth/weak-password',
  PERMISSION_DENIED = 'permission-denied',
  NETWORK_ERROR = 'network-error',
  UNKNOWN = 'unknown',
}

/**
 * Custom error class for app-specific errors
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code: ErrorCode | string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'AppError';
  }
}

