/**
 * Read Receipt Helpers
 * 
 * Utility functions for handling read receipt logic in group chats
 */

import { Message } from '../types';

export interface ReadReceiptUser {
  userId: string;
  displayName: string;
  hasRead: boolean;
  readAt?: Date; // Future enhancement: track when each user read
}

/**
 * Get read receipt status for a message
 * @param message - Message to check
 * @param participants - All chat participants
 * @param senderId - ID of the sender (to exclude from "not read" count)
 * @returns Object with read status information
 */
export const getReadReceiptStatus = (
  message: Message,
  participants: string[],
  senderId: string
): {
  totalParticipants: number;
  readCount: number;
  deliveredCount: number;
  allRead: boolean;
} => {
  // Remove sender from participants (sender always has read their own message)
  const otherParticipants = participants.filter(p => p !== senderId);
  
  const readBy = message.readBy || [];
  const readCount = readBy.length;
  
  // Count how many other participants have read
  const othersWhoRead = otherParticipants.filter(p => readBy.includes(p)).length;
  const allRead = othersWhoRead === otherParticipants.length && otherParticipants.length > 0;
  
  return {
    totalParticipants: otherParticipants.length,
    readCount: othersWhoRead,
    deliveredCount: otherParticipants.length - othersWhoRead,
    allRead,
  };
};

/**
 * Format read receipt list for display in modal
 * @param message - Message to show receipts for
 * @param participants - All chat participants (user IDs)
 * @param userNames - Map of userId -> displayName
 * @param senderId - ID of the message sender
 * @returns Categorized list of users with read status
 */
export const formatReadReceiptList = (
  message: Message,
  participants: string[],
  userNames: Record<string, string>,
  senderId: string
): {
  readBy: ReadReceiptUser[];
  deliveredTo: ReadReceiptUser[];
} => {
  const readBy = message.readBy || [];
  
  // Remove sender from participants
  const otherParticipants = participants.filter(p => p !== senderId);
  
  const readByList: ReadReceiptUser[] = [];
  const deliveredToList: ReadReceiptUser[] = [];
  
  otherParticipants.forEach(userId => {
    const user: ReadReceiptUser = {
      userId,
      displayName: userNames[userId] || 'Unknown User',
      hasRead: readBy.includes(userId),
    };
    
    if (user.hasRead) {
      readByList.push(user);
    } else {
      deliveredToList.push(user);
    }
  });
  
  // Sort alphabetically by display name
  readByList.sort((a, b) => a.displayName.localeCompare(b.displayName));
  deliveredToList.sort((a, b) => a.displayName.localeCompare(b.displayName));
  
  return {
    readBy: readByList,
    deliveredTo: deliveredToList,
  };
};

/**
 * Get a summary text for read receipts
 * @param readCount - Number of users who read
 * @param totalCount - Total number of other participants
 * @returns Summary text like "Read by 3 of 5"
 */
export const getReadReceiptSummary = (
  readCount: number,
  totalCount: number
): string => {
  if (readCount === 0) {
    return 'Delivered';
  }
  
  if (readCount === totalCount) {
    return `Read by all (${totalCount})`;
  }
  
  return `Read by ${readCount} of ${totalCount}`;
};

