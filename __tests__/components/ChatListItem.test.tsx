/**
 * ChatListItem Component Tests
 * 
 * Tests for the chat list item UI component
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ChatListItem } from '../../src/components/ChatListItem';
import { createMockDirectChat, createMockGroupChat } from '../../src/utils/mockData';
import { Timestamp } from 'firebase/firestore';

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

describe('ChatListItem', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  describe('Rendering', () => {
    it('should display participant name for direct chat', () => {
      const chat = createMockDirectChat({
        participantName: 'John Doe',
        lastMessage: 'Hello!',
      });
      
      const { getByText } = render(<ChatListItem chat={chat} />);
      
      expect(getByText('John Doe')).toBeTruthy();
    });

    it('should display group name for group chat', () => {
      const chat = createMockGroupChat({
        groupName: 'Project Team',
        lastMessage: 'Meeting at 3pm',
      });
      
      const { getByText } = render(<ChatListItem chat={chat} />);
      
      expect(getByText('Project Team')).toBeTruthy();
    });

    it('should display last message preview', () => {
      const chat = createMockDirectChat({
        lastMessage: 'This is the last message',
      });
      
      const { getByText } = render(<ChatListItem chat={chat} />);
      
      expect(getByText('This is the last message')).toBeTruthy();
    });

    it('should truncate long messages', () => {
      const longMessage = 'A'.repeat(50); // 50 characters
      const chat = createMockDirectChat({
        lastMessage: longMessage,
      });
      
      const { getByText } = render(<ChatListItem chat={chat} />);
      
      // Should show truncated version with "..."
      const displayedText = getByText(/\.\.\.$/);
      expect(displayedText).toBeTruthy();
    });

    it('should show "No messages yet" when lastMessage is empty', () => {
      const chat = createMockDirectChat({
        lastMessage: '',
      });
      
      const { getByText } = render(<ChatListItem chat={chat} />);
      
      expect(getByText('No messages yet')).toBeTruthy();
    });

    it('should display avatar with first letter of name', () => {
      const chat = createMockDirectChat({
        participantName: 'Alice',
      });
      
      const { getByText } = render(<ChatListItem chat={chat} />);
      
      expect(getByText('A')).toBeTruthy();
    });

    it('should display unread count badge when present', () => {
      const chat = createMockDirectChat({
        unreadCount: 5,
      });
      
      const { getByText } = render(<ChatListItem chat={chat} />);
      
      expect(getByText('5')).toBeTruthy();
    });

    it('should display "99+" for unread count over 99', () => {
      const chat = createMockDirectChat({
        unreadCount: 150,
      });
      
      const { getByText } = render(<ChatListItem chat={chat} />);
      
      expect(getByText('99+')).toBeTruthy();
    });

    it('should not display badge when unread count is 0', () => {
      const chat = createMockDirectChat({
        unreadCount: 0,
      });
      
      const { queryByText } = render(<ChatListItem chat={chat} />);
      
      // Badge should not be rendered
      expect(queryByText('0')).toBeNull();
    });
  });

  describe('Timestamp Formatting', () => {
    it('should format recent timestamp as time', () => {
      const now = new Date();
      const chat = createMockDirectChat({
        lastMessageTime: Timestamp.fromDate(now),
      });
      
      const { getByText } = render(<ChatListItem chat={chat} />);
      
      // Should show time format (e.g., "2:30 PM")
      const timeRegex = /\d{1,2}:\d{2}/;
      expect(getByText(timeRegex)).toBeTruthy();
    });

    it('should format older timestamp as day', () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      const chat = createMockDirectChat({
        lastMessageTime: Timestamp.fromDate(twoDaysAgo),
      });
      
      const { getByText } = render(<ChatListItem chat={chat} />);
      
      // Should show day format (e.g., "Mon", "Tue")
      const dayRegex = /(Mon|Tue|Wed|Thu|Fri|Sat|Sun)/;
      expect(getByText(dayRegex)).toBeTruthy();
    });
  });

  describe('Navigation', () => {
    it('should navigate to chat screen on press', () => {
      const chat = createMockDirectChat({
        id: 'chat123',
        participantName: 'John Doe',
      });
      
      const { getByTestId } = render(<ChatListItem chat={chat} />);
      
      const item = getByTestId('chat-list-item');
      fireEvent.press(item);
      
      expect(mockNavigate).toHaveBeenCalledWith('Chat', {
        chatId: 'chat123',
        chatName: 'John Doe',
      });
    });

    it('should pass correct chat name for group chat', () => {
      const chat = createMockGroupChat({
        id: 'group123',
        groupName: 'Team Chat',
      });
      
      const { getByTestId } = render(<ChatListItem chat={chat} />);
      
      const item = getByTestId('chat-list-item');
      fireEvent.press(item);
      
      expect(mockNavigate).toHaveBeenCalledWith('Chat', {
        chatId: 'group123',
        chatName: 'Team Chat',
      });
    });
  });
});

