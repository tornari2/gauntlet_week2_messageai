/**
 * Chat Store Tests
 * 
 * Unit tests for the chat state management store
 */

import { useChatStore } from '../../src/stores/chatStore';
import { createMockDirectChat } from '../../src/utils/mockData';

describe('Chat Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useChatStore.setState({
      chats: [],
      currentChat: null,
      loading: false,
      error: null,
    });
  });

  describe('State Management', () => {
    it('should have correct initial state', () => {
      const state = useChatStore.getState();
      expect(state.chats).toEqual([]);
      expect(state.currentChat).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should set chats array', () => {
      const mockChats = [
        createMockDirectChat({ id: '1' }),
        createMockDirectChat({ id: '2' }),
      ];
      
      useChatStore.getState().setChats(mockChats);
      
      const state = useChatStore.getState();
      expect(state.chats).toEqual(mockChats);
      expect(state.chats).toHaveLength(2);
    });

    it('should set current chat', () => {
      const mockChat = createMockDirectChat({ id: '1', participantName: 'John Doe' });
      
      useChatStore.getState().setCurrentChat(mockChat);
      
      const state = useChatStore.getState();
      expect(state.currentChat).toEqual(mockChat);
      expect(state.currentChat?.participantName).toBe('John Doe');
    });

    it('should clear current chat by setting to null', () => {
      const mockChat = createMockDirectChat({ id: '1' });
      useChatStore.getState().setCurrentChat(mockChat);
      
      useChatStore.getState().setCurrentChat(null);
      
      expect(useChatStore.getState().currentChat).toBeNull();
    });

    it('should set loading state', () => {
      useChatStore.getState().setLoading(true);
      expect(useChatStore.getState().loading).toBe(true);
      
      useChatStore.getState().setLoading(false);
      expect(useChatStore.getState().loading).toBe(false);
    });

    it('should set error message', () => {
      const errorMessage = 'Failed to load chats';
      
      useChatStore.getState().setError(errorMessage);
      
      expect(useChatStore.getState().error).toBe(errorMessage);
    });

    it('should clear error', () => {
      useChatStore.getState().setError('Some error');
      
      useChatStore.getState().clearError();
      
      expect(useChatStore.getState().error).toBeNull();
    });
  });

  describe('Chat Updates', () => {
    it('should update chats when new data arrives', () => {
      const initialChats = [createMockDirectChat({ id: '1' })];
      useChatStore.getState().setChats(initialChats);
      
      const updatedChats = [
        createMockDirectChat({ id: '1' }),
        createMockDirectChat({ id: '2' }),
      ];
      useChatStore.getState().setChats(updatedChats);
      
      expect(useChatStore.getState().chats).toHaveLength(2);
    });

    it('should maintain chat order', () => {
      const chat1 = createMockDirectChat({ id: '1', participantName: 'Alice' });
      const chat2 = createMockDirectChat({ id: '2', participantName: 'Bob' });
      const chat3 = createMockDirectChat({ id: '3', participantName: 'Charlie' });
      
      useChatStore.getState().setChats([chat1, chat2, chat3]);
      
      const chats = useChatStore.getState().chats;
      expect(chats[0].participantName).toBe('Alice');
      expect(chats[1].participantName).toBe('Bob');
      expect(chats[2].participantName).toBe('Charlie');
    });
  });
});

