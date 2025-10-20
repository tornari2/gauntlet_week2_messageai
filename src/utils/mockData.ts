/**
 * Mock Data Utilities
 * 
 * Helper functions to create mock data for testing UI without full backend
 * Useful for development and testing
 */

import { Chat, User, Message } from '../types';
import { Timestamp } from 'firebase/firestore';

/**
 * Create a mock user
 */
export function createMockUser(overrides?: Partial<User>): User {
  const defaultUser: User = {
    uid: `user_${Math.random().toString(36).substr(2, 9)}`,
    email: 'test@example.com',
    displayName: 'Test User',
    isOnline: false,
    lastSeen: Timestamp.fromDate(new Date()),
    createdAt: Timestamp.fromDate(new Date()),
  };

  return { ...defaultUser, ...overrides };
}

/**
 * Create a mock direct chat
 */
export function createMockDirectChat(overrides?: Partial<Chat>): Chat {
  const defaultChat: Chat = {
    id: `chat_${Math.random().toString(36).substr(2, 9)}`,
    type: 'direct',
    participants: ['user1', 'user2'],
    lastMessage: 'Hey, how are you?',
    lastMessageTime: Timestamp.fromDate(new Date()),
    createdAt: Timestamp.fromDate(new Date()),
  };

  return { ...defaultChat, ...overrides };
}

/**
 * Create a mock group chat
 */
export function createMockGroupChat(overrides?: Partial<Chat>): Chat {
  const defaultChat: Chat = {
    id: `chat_${Math.random().toString(36).substr(2, 9)}`,
    type: 'group',
    participants: ['user1', 'user2', 'user3'],
    lastMessage: 'Welcome to the group!',
    lastMessageTime: Timestamp.fromDate(new Date()),
    createdAt: Timestamp.fromDate(new Date()),
    groupName: 'Test Group',
  };

  return { ...defaultChat, ...overrides };
}

/**
 * Create a mock message
 */
export function createMockMessage(overrides?: Partial<Message>): Message {
  const defaultMessage: Message = {
    id: `msg_${Math.random().toString(36).substr(2, 9)}`,
    senderId: 'user_123',
    text: 'Hello, this is a test message!',
    timestamp: Timestamp.fromDate(new Date()),
    readBy: [],
    pending: false,
    failed: false,
  };

  return { ...defaultMessage, ...overrides };
}

/**
 * Create multiple mock chats for testing chat list
 */
export function createMockChats(count: number = 5): Chat[] {
  const chats: Chat[] = [];
  const names = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry'];
  const messages = [
    'Hey, how are you?',
    'See you tomorrow!',
    'Thanks for your help!',
    'Let\'s catch up soon',
    'Did you see the news?',
    'Happy birthday! 🎉',
    'Great work on the project',
    'Call me when you can',
  ];

  for (let i = 0; i < count && i < names.length; i++) {
    const minutesAgo = i * 15;
    const timestamp = new Date(Date.now() - minutesAgo * 60 * 1000);
    
    chats.push({
      id: `chat_${i}`,
      type: 'direct',
      participants: ['currentUser', `user_${i}`],
      lastMessage: messages[i % messages.length],
      lastMessageTime: Timestamp.fromDate(timestamp),
      createdAt: Timestamp.fromDate(new Date(Date.now() - i * 24 * 60 * 60 * 1000)),
    });
  }

  return chats;
}

/**
 * Create mock messages for a chat
 */
export function createMockMessages(count: number = 10): Message[] {
  const messages: Message[] = [];
  const sampleTexts = [
    'Hello!',
    'How are you doing?',
    'I\'m great, thanks for asking!',
    'What are you up to today?',
    'Just working on some projects',
    'That sounds interesting!',
    'Yeah, it\'s pretty cool',
    'Want to grab lunch later?',
    'Sure, that sounds good!',
    'Great, let\'s meet at noon',
  ];

  for (let i = 0; i < count; i++) {
    const minutesAgo = (count - i) * 5;
    const timestamp = new Date(Date.now() - minutesAgo * 60 * 1000);
    const isOwnMessage = i % 2 === 0;

    messages.push({
      id: `msg_${i}`,
      senderId: isOwnMessage ? 'currentUser' : 'otherUser',
      text: sampleTexts[i % sampleTexts.length],
      timestamp: Timestamp.fromDate(timestamp),
      readBy: isOwnMessage ? ['currentUser', 'otherUser'] : ['currentUser'],
      pending: false,
      failed: false,
    });
  }

  return messages;
}

