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
import i18n from '../i18n';

interface SwipeableChatListItemProps {
  chat: ChatWithDetails;
}

export const SwipeableChatListItem: React.FC<SwipeableChatListItemProps> = ({ chat }) => {
  const deleteChat = useChatStore((state) => state.deleteChat);
  const user = useAuthStore((state) => state.user);

  const handleLongPress = () => {
    if (!user) {
      Alert.alert(i18n.t('common.error'), i18n.t('errors.unauthorized'));
      return;
    }

    Alert.alert(
      i18n.t('chatList.deleteChatConfirm'),
      i18n.t('chatList.deleteChatMessage'),
      [
        {
          text: i18n.t('common.cancel'),
          style: 'cancel',
        },
        {
          text: i18n.t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteChat(chat.id, user.uid);
            } catch (error) {
              console.error('Error deleting chat:', error);
              Alert.alert(i18n.t('common.error'), i18n.t('errors.generic'));
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

