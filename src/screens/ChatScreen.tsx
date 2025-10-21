/**
 * ChatScreen
 * 
 * Individual chat conversation screen with real-time messaging and presence
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { doc, onSnapshot } from 'firebase/firestore';
import { MainStackParamList } from '../navigation/AppNavigator';
import { useMessageStore } from '../stores/messageStore';
import { useAuthStore } from '../stores/authStore';
import { useChatStore } from '../stores/chatStore';
import { MessageBubble } from '../components/MessageBubble';
import { MessageInput } from '../components/MessageInput';
import { OnlineIndicator } from '../components/OnlineIndicator';
import { Message, User } from '../types';
import { firestore } from '../services/firebase';

type ChatScreenRouteProp = RouteProp<MainStackParamList, 'Chat'>;

export const ChatScreen: React.FC = () => {
  const route = useRoute<ChatScreenRouteProp>();
  const navigation = useNavigation();
  const { chatId, chatName } = route.params;
  
  const flatListRef = useRef<FlatList<Message>>(null);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  
  const { user } = useAuthStore();
  const { chats } = useChatStore();
  const {
    messages,
    loading,
    sendMessageOptimistic,
    retryMessage,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useMessageStore();
  
  const chatMessages = messages[chatId] || [];
  const isLoading = loading[chatId];

  // Get the current chat to find the other user
  const currentChat = chats.find(c => c.id === chatId);
  
  // Subscribe to other user's presence
  useEffect(() => {
    if (!currentChat || currentChat.type !== 'direct' || !user) {
      return;
    }
    
    // Get the other user ID
    const otherUserId = currentChat.participants.find(p => p !== user.uid);
    if (!otherUserId) {
      return;
    }
    
    // Subscribe to other user's document for real-time presence updates
    const userDocRef = doc(firestore, 'users', otherUserId);
    const unsubscribe = onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setOtherUser({
          uid: doc.id,
          email: data.email || '',
          displayName: data.displayName || '',
          photoURL: data.photoURL || null,
          isOnline: data.isOnline || false,
          lastSeen: data.lastSeen?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
        });
      }
    });
    
    return () => unsubscribe();
  }, [currentChat, user]);

  // Subscribe to messages on mount
  useEffect(() => {
    subscribeToMessages(chatId);
    
    return () => {
      unsubscribeFromMessages(chatId);
    };
  }, [chatId, subscribeToMessages, unsubscribeFromMessages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatMessages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [chatMessages.length]);

  const handleSend = async (text: string) => {
    if (!user) return;
    
    try {
      // Use optimistic sending - message appears instantly
      await sendMessageOptimistic(chatId, text, user.uid);
    } catch (error) {
      console.error('Error sending message:', error);
      // Message will show as failed, user can retry
    }
  };

  const handleRetry = async (tempId: string) => {
    try {
      await retryMessage(chatId, tempId);
    } catch (error) {
      console.error('Error retrying message:', error);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isSent = item.senderId === user?.uid;
    return (
      <MessageBubble 
        message={item} 
        isSent={isSent}
        onRetry={item.failed && item.tempId ? () => handleRetry(item.tempId!) : undefined}
      />
    );
  };

  const renderEmpty = () => {
    if (isLoading) {
      return null;
    }
    
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>💬</Text>
        <Text style={styles.emptyText}>No messages yet</Text>
        <Text style={styles.emptySubtext}>Say hi to start the conversation!</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          testID="back-button"
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{chatName}</Text>
          {otherUser && (
            <View style={styles.presenceContainer}>
              <OnlineIndicator 
                isOnline={otherUser.isOnline}
                lastSeen={otherUser.lastSeen}
                showText={true}
                size="small"
              />
            </View>
          )}
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Messages List */}
      {isLoading && chatMessages.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#25D366" />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={chatMessages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id || item.tempId || Math.random().toString()}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          ListEmptyComponent={renderEmpty}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
      )}

      {/* Message Input */}
      <MessageInput onSend={handleSend} disabled={!user} />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingTop: 50, // Account for status bar
    backgroundColor: '#25D366',
    borderBottomWidth: 1,
    borderBottomColor: '#1EA952',
  },
  backButton: {
    paddingRight: 12,
  },
  backText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  presenceContainer: {
    marginTop: 2,
  },
  headerRight: {
    width: 60, // Balance the back button
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    flexGrow: 1,
    paddingVertical: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8E8E93',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
});
