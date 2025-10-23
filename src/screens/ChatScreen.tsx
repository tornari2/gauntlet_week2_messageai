/**
 * ChatScreen
 * 
 * Individual chat conversation screen with real-time messaging, presence, and read receipts
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { doc, onSnapshot } from 'firebase/firestore';
import { ref, onValue } from 'firebase/database';
import { MainStackParamList } from '../navigation/AppNavigator';
import { useMessageStore } from '../stores/messageStore';
import { useAuthStore } from '../stores/authStore';
import { useChatStore } from '../stores/chatStore';
import { useNetworkStore } from '../stores/networkStore';
import { useNotificationStore } from '../stores/notificationStore';
import { MessageBubble } from '../components/MessageBubble';
import { MessageInput } from '../components/MessageInput';
import { OnlineIndicator } from '../components/OnlineIndicator';
import { TypingIndicator } from '../components/TypingIndicator';
import { ReadReceiptModal } from '../components/ReadReceiptModal';
import { Message, User } from '../types';
import { firestore, database } from '../services/firebase';
import { chatService } from '../services/chatService';
import { typingService } from '../services/typingService';
import { Colors } from '../constants/Colors';
import { getUserAvatarColor } from '../utils/userColors';

type ChatScreenRouteProp = RouteProp<MainStackParamList, 'Chat'>;

export const ChatScreen: React.FC = () => {
  const route = useRoute<ChatScreenRouteProp>();
  const navigation = useNavigation();
  const { chatId, chatName } = route.params;
  
  const flatListRef = useRef<FlatList<Message>>(null);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [participants, setParticipants] = useState<string[]>([]);
  const [participantUsers, setParticipantUsers] = useState<User[]>([]); // For group chats
  const [senderNames, setSenderNames] = useState<Record<string, string>>({});
  
  // Typing indicator state
  const [typingUserIds, setTypingUserIds] = useState<string[]>([]);
  const [typingUserNames, setTypingUserNames] = useState<string[]>([]);
  
  // Read receipt modal state
  const [showReadReceiptModal, setShowReadReceiptModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  
  const { user } = useAuthStore();
  const { chats } = useChatStore();
  const { isConnected } = useNetworkStore();
  const { setActiveChatId } = useNotificationStore();
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
  const isGroupChat = currentChat?.type === 'group';
  
  // Debug: Log when otherUser state changes
  useEffect(() => {
    if (otherUser) {
      console.log(`[ChatScreen] 🔄 otherUser state updated:`, {
        uid: otherUser.uid,
        displayName: otherUser.displayName,
        isOnline: otherUser.isOnline,
        lastSeen: otherUser.lastSeen,
      });
    }
  }, [otherUser]);
  
  // Debug: Log when participantUsers state changes
  useEffect(() => {
    if (participantUsers.length > 0) {
      console.log(`[ChatScreen] 🔄 participantUsers state updated:`, 
        participantUsers.map(u => ({
          uid: u.uid,
          displayName: u.displayName,
          isOnline: u.isOnline,
        }))
      );
    }
  }, [participantUsers]);
  
  // Set active chat ID when entering the screen
  useEffect(() => {
    setActiveChatId(chatId);
    
    return () => {
      // Clear active chat ID when leaving the screen
      setActiveChatId(null);
    };
  }, [chatId, setActiveChatId]);
  
  // Get chat participants and their names
  useEffect(() => {
    if (currentChat) {
      setParticipants(currentChat.participants);
      
      // Load sender names for group chats
      if (currentChat.type === 'group') {
        chatService.getUserDisplayNames(currentChat.participants)
          .then(names => setSenderNames(names))
          .catch(err => console.error('Error loading sender names:', err));
      }
    }
  }, [currentChat]);
  
  // Subscribe to group chat participant presence
  useEffect(() => {
    if (!currentChat || currentChat.type !== 'group' || !user) {
      return;
    }
    
    const unsubscribers: (() => void)[] = [];
    
    // Load initial participant data from Firestore
    Promise.all(
      currentChat.participants
        .filter(uid => uid !== user.uid) // Exclude current user
        .map(uid => {
          const userDocRef = doc(firestore, 'users', uid);
          return onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              setParticipantUsers(prev => {
                const others = prev.filter(u => u.uid !== uid);
                return [...others, {
                  uid: docSnap.id,
                  email: data.email || '',
                  displayName: data.displayName || '',
                  photoURL: data.photoURL || null,
                  isOnline: data.isOnline || false,
                  lastSeen: data.lastSeen?.toDate() || new Date(),
                  avatarColor: data.avatarColor,
                  createdAt: data.createdAt?.toDate() || new Date(),
                }];
              });
            }
          });
        })
    ).then(unsubs => {
      unsubscribers.push(...unsubs);
    });
    
    // Subscribe to RTDB for real-time presence updates
    currentChat.participants
      .filter(uid => uid !== user.uid)
      .forEach(uid => {
        const statusRef = ref(database, `/status/${uid}`);
        console.log(`[ChatScreen] Setting up RTDB listener for group participant: ${uid}`);
        const unsubscribe = onValue(
          statusRef,
          (snapshot) => {
            const status = snapshot.val();
            console.log(`[ChatScreen] RTDB group presence update for ${uid}:`, status);
            // Handle both online and offline states
            if (status) {
              const isOnline = status.state === 'online';
              console.log(`[ChatScreen] Setting participant ${uid} to ${isOnline ? 'ONLINE' : 'OFFLINE'}`);
              setParticipantUsers(prev =>
                prev.map(u =>
                  u.uid === uid
                    ? { ...u, isOnline, lastSeen: status.last_changed ? new Date(status.last_changed) : u.lastSeen }
                    : u
                )
              );
            } else {
              // If status is null/undefined, user is offline
              console.log(`[ChatScreen] Status is null for participant ${uid}, setting to OFFLINE`);
              setParticipantUsers(prev =>
                prev.map(u =>
                  u.uid === uid
                    ? { ...u, isOnline: false, lastSeen: new Date() }
                    : u
                )
              );
            }
          },
          (error) => {
            console.error(`[ChatScreen] ❌ ERROR subscribing to RTDB for group participant ${uid}:`, error);
          }
        );
        unsubscribers.push(unsubscribe);
      });
    
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [currentChat, user]);
  
  // Auto-read messages when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      if (!user) return;
      
      // Mark all unread messages as read
      const markAllAsRead = async () => {
        try {
          const unreadMessageIds = chatMessages
            .filter(msg => msg.senderId !== user.uid && !msg.readBy?.includes(user.uid))
            .map(msg => msg.id)
            .filter((id): id is string => id !== undefined && id !== '' && !id.startsWith('temp_'));
          
          if (unreadMessageIds.length > 0) {
            await chatService.markMessagesAsRead(chatId, unreadMessageIds, user.uid);
          }
        } catch (error) {
          console.error('Error marking messages as read:', error);
        }
      };
      
      // Mark messages as read when screen is focused
      markAllAsRead();
      
      // Also mark new messages as read
      if (chatMessages.length > 0) {
        markAllAsRead();
      }
    }, [chatId, user, chatMessages])
  );
  
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
    
    // First, get initial user data from Firestore
    const userDocRef = doc(firestore, 'users', otherUserId);
    const firestoreUnsubscribe = onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setOtherUser(prev => ({
          uid: doc.id,
          email: data.email || '',
          displayName: data.displayName || '',
          photoURL: data.photoURL || null,
          isOnline: prev?.isOnline ?? data.isOnline ?? false, // Keep RTDB value if we have it
          lastSeen: data.lastSeen?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
        }));
      }
    });
    
    // Subscribe to Realtime Database for instant presence updates (works with onDisconnect)
    const userStatusRef = ref(database, `/status/${otherUserId}`);
    console.log(`[ChatScreen] Setting up RTDB listener for direct chat user: ${otherUserId}`);
    const rtdbUnsubscribe = onValue(
      userStatusRef,
      (snapshot) => {
        const status = snapshot.val();
        console.log(`[ChatScreen] RTDB presence update for ${otherUserId}:`, status);
        // Handle both online and offline states
        if (status) {
          const isOnline = status.state === 'online';
          console.log(`[ChatScreen] Setting user ${otherUserId} to ${isOnline ? 'ONLINE' : 'OFFLINE'}`);
          setOtherUser(prev => prev ? {
            ...prev,
            isOnline,
            lastSeen: status.last_changed ? new Date(status.last_changed) : prev.lastSeen,
          } : null);
        } else {
          // If status is null/undefined, user is offline
          console.log(`[ChatScreen] Status is null for ${otherUserId}, setting to OFFLINE`);
          setOtherUser(prev => prev ? {
            ...prev,
            isOnline: false,
            lastSeen: new Date(),
          } : null);
        }
      },
      (error) => {
        console.error(`[ChatScreen] ❌ ERROR subscribing to RTDB for ${otherUserId}:`, error);
      }
    );
    
    return () => {
      firestoreUnsubscribe();
      rtdbUnsubscribe();
    };
  }, [currentChat, user]);

  // Subscribe to messages on mount
  useEffect(() => {
    subscribeToMessages(chatId);
    
    return () => {
      unsubscribeFromMessages(chatId);
    };
  }, [chatId, subscribeToMessages, unsubscribeFromMessages]);

  // Subscribe to typing indicators
  useEffect(() => {
    if (!user) return;
    
    console.log(`🟢 [ChatScreen] Setting up typing subscription for chat ${chatId}, currentUser=${user.uid}`);
    
    // Track the latest request to avoid race conditions
    let latestRequestId = 0;
    
    const unsubscribe = typingService.subscribeToTypingIndicators(
      chatId,
      user.uid,
      (userIds) => {
        console.log(`🟢 [ChatScreen] Received typing user IDs:`, userIds);
        
        // Increment request ID for this update
        const currentRequestId = ++latestRequestId;
        
        setTypingUserIds(userIds);
        
        // Fetch display names for typing users
        if (userIds.length > 0) {
          chatService.getUserDisplayNames(userIds)
            .then(names => {
              // Only update if this is still the latest request
              if (currentRequestId === latestRequestId) {
                const namesList = userIds.map(id => names[id] || 'Unknown');
                console.log(`🟢 [ChatScreen] Typing users resolved (request ${currentRequestId}):`, { userIds, names, namesList });
                setTypingUserNames(namesList);
              } else {
                console.log(`🟢 [ChatScreen] Ignoring stale name resolution (request ${currentRequestId}, latest is ${latestRequestId})`);
              }
            })
            .catch(err => console.error('Error loading typing user names:', err));
        } else {
          setTypingUserNames([]);
        }
      }
    );
    
    return () => {
      console.log(`🟢 [ChatScreen] Cleaning up typing subscription for chat ${chatId}`);
      unsubscribe();
      // Stop our own typing indicator when leaving
      typingService.setUserStoppedTyping(chatId, user.uid).catch(err => 
        console.error('Error stopping typing:', err)
      );
    };
  }, [chatId, user]);

  // Auto-scroll to bottom when new messages arrive or typing indicator appears
  useEffect(() => {
    if ((chatMessages.length > 0 || typingUserIds.length > 0) && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [chatMessages.length, typingUserIds.length]);

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

  const handleTypingChange = (isTyping: boolean) => {
    if (!user) return;
    
    console.log(`🟡 [ChatScreen] User ${user.uid} typing status changed to: ${isTyping}`);
    
    if (isTyping) {
      typingService.setUserTyping(chatId, user.uid).catch(err =>
        console.error('Error setting typing status:', err)
      );
    } else {
      typingService.setUserStoppedTyping(chatId, user.uid).catch(err =>
        console.error('Error clearing typing status:', err)
      );
    }
  };

  const handleRetry = async (tempId: string) => {
    try {
      await retryMessage(chatId, tempId);
    } catch (error) {
      console.error('Error retrying message:', error);
    }
  };

  const handleReadReceiptPress = (message: Message) => {
    if (isGroupChat) {
      setSelectedMessage(message);
      setShowReadReceiptModal(true);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isSent = item.senderId === user?.uid;
    const senderName = isGroupChat && !isSent ? senderNames[item.senderId] : undefined;
    
    // Get sender's avatar color for group chats
    let senderColor: string | undefined;
    if (isGroupChat && !isSent) {
      const sender = participantUsers.find(u => u.uid === item.senderId);
      senderColor = sender ? getUserAvatarColor(sender) : undefined;
    }
    
    return (
      <MessageBubble 
        message={item} 
        isSent={isSent}
        participants={participants}
        senderName={senderName}
        senderColor={senderColor}
        isGroupChat={isGroupChat}
        onReadReceiptPress={isSent ? () => handleReadReceiptPress(item) : undefined}
        onRetry={item.failed && item.tempId ? () => handleRetry(item.tempId!) : undefined}
      />
    );
  };

  // Optimize FlatList performance with getItemLayout
  const getMessageItemLayout = (_: any, index: number) => ({
    length: 80, // Approximate average height of a message bubble
    offset: 80 * index,
    index,
  });

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
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            testID="back-button"
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>
              {isGroupChat ? currentChat?.groupName : chatName}
            </Text>
            {isGroupChat ? (
              <View style={styles.participantsContainer}>
                {participantUsers.length > 0 ? (
                  participantUsers.map((participant, index) => (
                    <View key={participant.uid} style={styles.participantItem}>
                      <OnlineIndicator 
                        isOnline={participant.isOnline}
                        lastSeen={participant.lastSeen}
                        showText={false}
                        size="small"
                      />
                      <Text style={styles.participantName}>
                        {participant.displayName}
                        {index < participantUsers.length - 1 ? ', ' : ''}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.participantCount}>
                    {participants.length} participant{participants.length !== 1 ? 's' : ''}
                  </Text>
                )}
              </View>
            ) : otherUser ? (
              <View style={styles.presenceContainer}>
                <OnlineIndicator 
                  isOnline={isConnected ? otherUser.isOnline : false}
                  lastSeen={otherUser.lastSeen}
                  showText={true}
                  size="small"
                />
                {!isConnected && (
                  <Text style={styles.offlineNotice}>(You're offline)</Text>
                )}
              </View>
            ) : null}
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
          keyExtractor={(item, index) => item.id || item.tempId || `msg-${index}`}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={() => (
            <TypingIndicator 
              typingUsers={typingUserNames}
            />
          )}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          // Performance optimizations
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={21}
          initialNumToRender={15}
          updateCellsBatchingPeriod={50}
          getItemLayout={getMessageItemLayout}
        />
      )}

      {/* Message Input */}
      <MessageInput 
        onSend={handleSend}
        onTypingChange={handleTypingChange}
        disabled={!user} 
      />
      
      {/* Read Receipt Modal */}
      <ReadReceiptModal
        visible={showReadReceiptModal}
        message={selectedMessage}
        participants={participants}
        userNames={senderNames}
        onClose={() => {
          setShowReadReceiptModal(false);
          setSelectedMessage(null);
        }}
      />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  container: {
    flex: 1,
    backgroundColor: '#F5EBE0', // Light tan to match chat items
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primaryDark,
  },
  backButton: {
    padding: 8,
    minWidth: 80,
  },
  backText: {
    color: '#FFFFFF',
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
    color: '#FFFFFF',
  },
  presenceContainer: {
    marginTop: 4,
    alignItems: 'center',
  },
  offlineNotice: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
    fontStyle: 'italic',
  },
  participantCount: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  participantsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 4,
    maxWidth: 250,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 4,
  },
  participantName: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 4,
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
