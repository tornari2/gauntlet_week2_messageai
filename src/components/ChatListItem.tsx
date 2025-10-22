/**
 * ChatListItem Component
 * 
 * Displays a single chat in the chat list
 * Shows participant name, last message preview, timestamp, and online indicator
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChatWithDetails } from '../types';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../navigation/AppNavigator';
import { OnlineIndicator } from './OnlineIndicator';
import { Colors } from '../constants/Colors';

type ChatListItemNavigationProp = NativeStackNavigationProp<MainStackParamList, 'ChatsList'>;

interface ChatListItemProps {
  chat: ChatWithDetails;
}

export const ChatListItem: React.FC<ChatListItemProps> = React.memo(({ chat }) => {
  const navigation = useNavigation<ChatListItemNavigationProp>();

  const handlePress = () => {
    navigation.navigate('Chat', { chatId: chat.id, chatName: getChatName() });
  };

  const getChatName = () => {
    if (chat.type === 'direct') {
      return chat.otherUserName || 'Unknown User';
    }
    return chat.groupName || 'Group Chat';
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

  const getLastMessagePreview = () => {
    if (!chat.lastMessage) {
      return 'No messages yet';
    }
    
    // Truncate long messages
    if (chat.lastMessage.length > 40) {
      return chat.lastMessage.substring(0, 40) + '...';
    }
    
    return chat.lastMessage;
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
      testID="chat-list-item"
    >
      {/* Avatar placeholder */}
      <View style={styles.avatarContainer}>
        <View style={[
          styles.avatar,
          chat.type === 'group' && styles.groupAvatar
        ]}>
          <Text style={styles.avatarText}>
            {chat.type === 'group' ? '👥' : getChatName().charAt(0).toUpperCase()}
          </Text>
        </View>
        {/* Online indicator for direct chats */}
        {chat.type === 'direct' && (
          <View style={styles.onlineIndicatorWrapper}>
            <OnlineIndicator 
              isOnline={chat.otherUserOnline || false}
              lastSeen={chat.otherUserLastSeen}
              size="small"
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
  const prevTime = prevProps.chat.lastMessageTime?.toMillis?.() || 0;
  const nextTime = nextProps.chat.lastMessageTime?.toMillis?.() || 0;
  
  return (
    prevProps.chat.id === nextProps.chat.id &&
    prevProps.chat.lastMessage === nextProps.chat.lastMessage &&
    prevTime === nextTime &&
    prevOnline === nextOnline &&
    prevProps.chat.otherUserLastSeen === nextProps.chat.otherUserLastSeen &&
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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupAvatar: {
    backgroundColor: Colors.primaryDark,
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
  },
  chatName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  participantCount: {
    fontSize: 13,
    color: '#8e8e93',
    marginLeft: 4,
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

