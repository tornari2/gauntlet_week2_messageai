/**
 * ChatListItem Component
 * 
 * Displays a single chat in the chat list
 * Shows participant name, last message preview, timestamp, and online indicator
 */

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChatWithDetails } from '../types';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../navigation/AppNavigator';
import { OnlineIndicator } from './OnlineIndicator';
import { Colors } from '../constants/Colors';
import { useNetworkStore } from '../stores/networkStore';
import { useTranslationStore } from '../stores/translationStore';
import * as translationService from '../services/translationService';

type ChatListItemNavigationProp = NativeStackNavigationProp<MainStackParamList, 'ChatsList'>;

interface ChatListItemProps {
  chat: ChatWithDetails;
  onLongPress?: () => void;
}

export const ChatListItem: React.FC<ChatListItemProps> = React.memo(({ chat, onLongPress }) => {
  const navigation = useNavigation<ChatListItemNavigationProp>();
  const isConnected = useNetworkStore((state) => state.isConnected);
  const userLanguage = useTranslationStore((state) => state.userLanguage);
  const autoTranslate = useTranslationStore((state) => state.autoTranslateEnabled[chat.id] ?? false);
  
  const [translatedPreview, setTranslatedPreview] = useState<string | null>(null);

  const handlePress = () => {
    navigation.navigate('Chat', { chatId: chat.id, chatName: getChatName() });
  };

  const getChatName = () => {
    if (chat.type === 'direct') {
      return chat.otherUserName || 'Unknown User';
    }
    return chat.groupName || 'Group Chat';
  };

  const getAvatarColor = () => {
    if (chat.type === 'direct' && chat.otherUserAvatarColor) {
      return chat.otherUserAvatarColor;
    }
    if (chat.type === 'group') {
      return Colors.primaryDark;
    }
    return Colors.primary; // Default for direct chats
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      
      // Less than 24 hours - show time
      if (diff < 24 * 60 * 60 * 1000) {
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      }
      
      // Less than 7 days - show day
      if (diff < 7 * 24 * 60 * 60 * 1000) {
        return date.toLocaleDateString('en-US', { weekday: 'short' });
      }
      
      // Older - show date
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return '';
    }
  };

  // Effect to translate the last message preview when auto-translate is enabled
  useEffect(() => {
    const translatePreview = async () => {
      // Only translate if auto-translate is enabled and there's a message
      if (!autoTranslate || !chat.lastMessage || chat.lastMessage === 'No messages yet') {
        setTranslatedPreview(null);
        return;
      }
      
      // Don't translate if already in user's language
      // We can't detect language of the preview easily, so we'll just translate it
      // The translation service will handle caching
      
      try {
        const result = await translationService.translateText(
          chat.lastMessage,
          userLanguage
        );
        setTranslatedPreview(result.translatedText);
      } catch (error) {
        console.error('Error translating chat preview:', error);
        setTranslatedPreview(null);
      }
    };
    
    translatePreview();
  }, [chat.lastMessage, autoTranslate, userLanguage, chat.id]);

  const getLastMessagePreview = () => {
    if (!chat.lastMessage) {
      return 'No messages yet';
    }
    
    // Use translated preview if available
    const messageToDisplay = (autoTranslate && translatedPreview) ? translatedPreview : chat.lastMessage;
    
    // Truncate long messages
    if (messageToDisplay.length > 40) {
      return messageToDisplay.substring(0, 40) + '...';
    }
    
    return messageToDisplay;
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
      testID="chat-list-item"
    >
      {/* Avatar placeholder */}
      <View style={styles.avatarContainer}>
        {chat.type === 'group' ? (
          <View style={[styles.avatar, styles.groupAvatar]}>
            <Text style={styles.groupAvatarIcon}>👥</Text>
          </View>
        ) : (
          <View style={[
            styles.avatar,
            { backgroundColor: getAvatarColor() }
          ]}>
            <Text style={styles.avatarText}>
              {getChatName().charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        {/* Online indicator for direct chats */}
        {chat.type === 'direct' && (
          <View style={styles.onlineIndicatorWrapper}>
            <OnlineIndicator 
              isOnline={chat.otherUserOnline || false}
              lastSeen={chat.otherUserLastSeen}
              size="small"
              isUnknown={!isConnected}
            />
          </View>
        )}
      </View>

      {/* Chat info */}
      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <View style={styles.nameContainer}>
            <Text style={styles.chatName} numberOfLines={1}>
              {getChatName()}
            </Text>
            {chat.type === 'group' && (
              <Text style={styles.participantCount}>
                ({chat.participants.length})
              </Text>
            )}
          </View>
          <Text style={styles.timestamp}>
            {formatTimestamp(chat.lastMessageTime)}
          </Text>
        </View>
        
        <View style={styles.messageRow}>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {getLastMessagePreview()}
          </Text>
          {chat.unreadCount && chat.unreadCount > 0 ? (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>
                {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function - only re-render if these specific props change
  // Compare online status using boolean conversion to avoid re-render on undefined vs false changes
  const prevOnline = Boolean(prevProps.chat.otherUserOnline);
  const nextOnline = Boolean(nextProps.chat.otherUserOnline);
  
  // Compare timestamps by converting to milliseconds to avoid object reference changes
  const getTimestamp = (time: any) => {
    if (!time) return 0;
    if (typeof time.toMillis === 'function') return time.toMillis();
    if (time instanceof Date) return time.getTime();
    return 0;
  };
  
  const prevTime = getTimestamp(prevProps.chat.lastMessageTime);
  const nextTime = getTimestamp(nextProps.chat.lastMessageTime);
  
  return (
    prevProps.chat.id === nextProps.chat.id &&
    prevProps.chat.lastMessage === nextProps.chat.lastMessage &&
    prevTime === nextTime &&
    prevOnline === nextOnline &&
    prevProps.chat.otherUserLastSeen === nextProps.chat.otherUserLastSeen &&
    prevProps.chat.otherUserAvatarColor === nextProps.chat.otherUserAvatarColor &&
    prevProps.chat.unreadCount === nextProps.chat.unreadCount &&
    prevProps.chat.otherUserName === nextProps.chat.otherUserName &&
    prevProps.chat.groupName === nextProps.chat.groupName &&
    prevProps.chat.participants.length === nextProps.chat.participants.length
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#F5EBE0', // Light tan to match ChatsListScreen
    borderBottomWidth: 1,
    borderBottomColor: '#E8D7C7', // Slightly darker tan for border
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupAvatar: {
    backgroundColor: Colors.primaryDark,
  },
  groupAvatarIcon: {
    fontSize: 28,
    color: '#fff',
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  onlineIndicatorWrapper: {
    position: 'absolute',
    bottom: 2,
    right: 2,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  chatName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    flexShrink: 1,
  },
  participantCount: {
    fontSize: 14,
    color: '#a0a0a0',
    marginLeft: 4,
    flexShrink: 0,
  },
  timestamp: {
    fontSize: 13,
    color: '#8e8e93',
    marginLeft: 8,
  },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 15,
    color: '#8e8e93',
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

