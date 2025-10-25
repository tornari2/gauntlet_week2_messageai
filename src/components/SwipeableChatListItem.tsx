/**
 * SwipeableChatListItem Component
 * 
 * Wraps ChatListItem with long-press-to-delete functionality
 */

import React from 'react';
import { Alert } from 'react-native';
import { ChatWithDetails } from '../types';
import { ChatListItem } from './ChatListItem';
import { useChatStore } from '../stores/chatStore';
import { useAuthStore } from '../stores/authStore';

interface SwipeableChatListItemProps {
  chat: ChatWithDetails;
}

export const SwipeableChatListItem: React.FC<SwipeableChatListItemProps> = ({ chat }) => {
  const deleteChat = useChatStore((state) => state.deleteChat);
  const user = useAuthStore((state) => state.user);

  const handleLongPress = () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to delete chats');
      return;
    }

    Alert.alert(
      'Delete Chat',
      `Are you sure you want to delete this chat${chat.type === 'direct' ? ` with ${chat.otherUserName}` : ''}? This will delete all messages.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteChat(chat.id, user.uid);
            } catch (error) {
              console.error('Error deleting chat:', error);
              Alert.alert('Error', 'Failed to delete chat. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <ChatListItem 
      chat={chat}
      onLongPress={handleLongPress}
    />
  );
};

