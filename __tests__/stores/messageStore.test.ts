/**
 * Message Store Tests
 */

import { useMessageStore } from '../../src/stores/messageStore';
import { Message } from '../../src/types';

// Mock the chat service
jest.mock('../../src/services/chatService', () => ({
  chatService: {
    subscribeToMessages: jest.fn(() => jest.fn()),
  },
}));

describe('Message Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useMessageStore.setState({
      messages: {},
      loading: {},
      error: {},
      unsubscribers: {},
    });
  });

  describe('setMessages', () => {
    it('should set messages for a chat', () => {
      const chatId = 'chat1';
      const messages: Message[] = [
        {
          id: '1',
          text: 'Hello',
          senderId: 'user1',
          timestamp: new Date('2025-01-01T10:00:00'),
          readBy: ['user1'],
        },
        {
          id: '2',
          text: 'Hi',
          senderId: 'user2',
          timestamp: new Date('2025-01-01T10:01:00'),
          readBy: ['user2'],
        },
      ];

      useMessageStore.getState().setMessages(chatId, messages);

      const state = useMessageStore.getState();
      expect(state.messages[chatId]).toHaveLength(2);
      expect(state.messages[chatId][0].text).toBe('Hello');
      expect(state.messages[chatId][1].text).toBe('Hi');
    });

    it('should sort messages by timestamp', () => {
      const chatId = 'chat1';
      const messages: Message[] = [
        {
          id: '2',
          text: 'Second',
          senderId: 'user1',
          timestamp: new Date('2025-01-01T10:01:00'),
          readBy: [],
        },
        {
          id: '1',
          text: 'First',
          senderId: 'user1',
          timestamp: new Date('2025-01-01T10:00:00'),
          readBy: [],
        },
      ];

      useMessageStore.getState().setMessages(chatId, messages);

      const state = useMessageStore.getState();
      expect(state.messages[chatId][0].text).toBe('First');
      expect(state.messages[chatId][1].text).toBe('Second');
    });
  });

  describe('addMessage', () => {
    it('should add a message to a chat', () => {
      const chatId = 'chat1';
      const message: Message = {
        id: '1',
        text: 'Hello',
        senderId: 'user1',
        timestamp: new Date(),
        readBy: ['user1'],
      };

      useMessageStore.getState().addMessage(chatId, message);

      const state = useMessageStore.getState();
      expect(state.messages[chatId]).toHaveLength(1);
      expect(state.messages[chatId][0]).toEqual(message);
    });

    it('should not duplicate messages with same id', () => {
      const chatId = 'chat1';
      const message: Message = {
        id: '1',
        text: 'Hello',
        senderId: 'user1',
        timestamp: new Date(),
        readBy: ['user1'],
      };

      useMessageStore.getState().addMessage(chatId, message);
      useMessageStore.getState().addMessage(chatId, message);

      const state = useMessageStore.getState();
      expect(state.messages[chatId]).toHaveLength(1);
    });

    it('should update existing message if tempId matches', () => {
      const chatId = 'chat1';
      const tempMessage: Message = {
        id: '',
        tempId: 'temp1',
        text: 'Hello',
        senderId: 'user1',
        timestamp: new Date(),
        readBy: [],
        pending: true,
      };

      const confirmedMessage: Message = {
        id: 'msg1',
        tempId: 'temp1',
        text: 'Hello',
        senderId: 'user1',
        timestamp: new Date(),
        readBy: ['user1'],
        pending: false,
      };

      useMessageStore.getState().addMessage(chatId, tempMessage);
      useMessageStore.getState().addMessage(chatId, confirmedMessage);

      const state = useMessageStore.getState();
      expect(state.messages[chatId]).toHaveLength(1);
      expect(state.messages[chatId][0].id).toBe('msg1');
      expect(state.messages[chatId][0].pending).toBe(false);
    });

    it('should maintain chronological order when adding messages', () => {
      const chatId = 'chat1';
      const msg1: Message = {
        id: '1',
        text: 'First',
        senderId: 'user1',
        timestamp: new Date('2025-01-01T10:00:00'),
        readBy: [],
      };

      const msg2: Message = {
        id: '2',
        text: 'Second',
        senderId: 'user1',
        timestamp: new Date('2025-01-01T10:01:00'),
        readBy: [],
      };

      const msg3: Message = {
        id: '3',
        text: 'Third',
        senderId: 'user1',
        timestamp: new Date('2025-01-01T10:02:00'),
        readBy: [],
      };

      // Add in random order
      useMessageStore.getState().addMessage(chatId, msg2);
      useMessageStore.getState().addMessage(chatId, msg1);
      useMessageStore.getState().addMessage(chatId, msg3);

      const state = useMessageStore.getState();
      expect(state.messages[chatId][0].text).toBe('First');
      expect(state.messages[chatId][1].text).toBe('Second');
      expect(state.messages[chatId][2].text).toBe('Third');
    });
  });

  describe('updateMessage', () => {
    it('should update a message by id', () => {
      const chatId = 'chat1';
      const message: Message = {
        id: '1',
        text: 'Hello',
        senderId: 'user1',
        timestamp: new Date(),
        readBy: [],
        pending: true,
      };

      useMessageStore.getState().addMessage(chatId, message);
      useMessageStore.getState().updateMessage(chatId, '1', { pending: false });

      const state = useMessageStore.getState();
      expect(state.messages[chatId][0].pending).toBe(false);
    });

    it('should update a message by tempId', () => {
      const chatId = 'chat1';
      const message: Message = {
        id: '',
        tempId: 'temp1',
        text: 'Hello',
        senderId: 'user1',
        timestamp: new Date(),
        readBy: [],
        pending: true,
      };

      useMessageStore.getState().addMessage(chatId, message);
      useMessageStore.getState().updateMessage(chatId, 'temp1', { 
        id: 'msg1',
        pending: false 
      });

      const state = useMessageStore.getState();
      expect(state.messages[chatId][0].id).toBe('msg1');
      expect(state.messages[chatId][0].pending).toBe(false);
    });
  });

  describe('clearMessages', () => {
    it('should clear messages for a chat', () => {
      const chatId = 'chat1';
      const message: Message = {
        id: '1',
        text: 'Hello',
        senderId: 'user1',
        timestamp: new Date(),
        readBy: [],
      };

      useMessageStore.getState().addMessage(chatId, message);
      useMessageStore.getState().clearMessages(chatId);

      const state = useMessageStore.getState();
      expect(state.messages[chatId]).toBeUndefined();
    });
  });

  describe('setLoading', () => {
    it('should set loading state for a chat', () => {
      const chatId = 'chat1';

      useMessageStore.getState().setLoading(chatId, true);

      const state = useMessageStore.getState();
      expect(state.loading[chatId]).toBe(true);
    });
  });

  describe('setError', () => {
    it('should set error state for a chat', () => {
      const chatId = 'chat1';
      const error = new Error('Test error');

      useMessageStore.getState().setError(chatId, error);

      const state = useMessageStore.getState();
      expect(state.error[chatId]).toBe(error);
    });
  });
});


