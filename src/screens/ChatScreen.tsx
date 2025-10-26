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
import { doc, onSnapshot, getDoc, setDoc } from 'firebase/firestore';
import { ref, onValue } from 'firebase/database';
import { MainStackParamList } from '../navigation/AppNavigator';
import { useMessageStore } from '../stores/messageStore';
import { useAuthStore } from '../stores/authStore';
import { useChatStore } from '../stores/chatStore';
import { useNetworkStore } from '../stores/networkStore';
import { useNotificationStore } from '../stores/notificationStore';
import { useTranslationStore } from '../stores/translationStore';
import { MessageBubble } from '../components/MessageBubble';
import { MessageInput } from '../components/MessageInput';
import { OnlineIndicator } from '../components/OnlineIndicator';
import { TypingIndicator } from '../components/TypingIndicator';
import { ReadReceiptModal } from '../components/ReadReceiptModal';
import { CulturalContextModal } from '../components/CulturalContextModal';
import { SlangExplanationModal } from '../components/SlangExplanationModal';
import { MultilingualSummaryModal } from '../components/MultilingualSummaryModal';
import { Message, User } from '../types';
import { firestore, database } from '../services/firebase';
import { chatService } from '../services/chatService';
import { typingService } from '../services/typingService';
import { notificationService } from '../services/notificationService';
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
  const processedMessageIds = useRef<Set<string>>(new Set()); // Track processed messages to prevent infinite loop
  
  // Typing indicator state
  const [typingUserIds, setTypingUserIds] = useState<string[]>([]);
  const [typingUserNames, setTypingUserNames] = useState<string[]>([]);
  
  // Read receipt modal state
  const [showReadReceiptModal, setShowReadReceiptModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  
  // AI Features state
  const [selectedMessageForContext, setSelectedMessageForContext] = useState<Message | null>(null);
  const [showCulturalContextModal, setShowCulturalContextModal] = useState(false);
  const [showSlangModal, setShowSlangModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  
  const { user } = useAuthStore();
  const { chats } = useChatStore();
  const { isConnected } = useNetworkStore();
  const { setActiveChatId } = useNotificationStore();
  const translationStore = useTranslationStore();
  const isAutoTranslateEnabled = translationStore.isAutoTranslateEnabled(chatId); // Subscribe to this specific value
  const {
    messages,
    loading,
    sendMessageOptimistic,
    sendImageOptimistic,
    retryMessage,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useMessageStore();
  
  const chatMessages = messages[chatId] || [];
  const isLoading = loading[chatId];

  // Debug: Log messages to see if detectedLanguage exists
  useEffect(() => {
    if (chatMessages.length > 0) {
      console.log('[DEBUG] Messages:', chatMessages.map(m => ({
        id: m.id,
        text: m.text?.substring(0, 20),
        hasDetectedLang: !!m.detectedLanguage,
        detectedLang: m.detectedLanguage
      })));
    }
  }, [chatMessages]);

  // Get the current chat to find the other user
  const currentChat = chats.find(c => c.id === chatId);
  const isGroupChat = currentChat?.type === 'group';
  
  // For direct chats, get presence from the chat object (already subscribed via chatService)
  const directChatOnlineStatus = currentChat?.type === 'direct' ? currentChat.otherUserOnline : undefined;
  const directChatLastSeen = currentChat?.type === 'direct' ? currentChat.otherUserLastSeen : undefined;
  
  // Set active chat ID when entering the screen
  useEffect(() => {
    setActiveChatId(chatId);
    
    // Clear any notifications for this chat
    notificationService.clearChatNotificationCount(chatId);
    
    // Load user language preference
    if (user) {
      translationStore.loadUserLanguage(user.uid);
    }
    
    // Load auto-translate setting for this chat
    translationStore.loadAutoTranslateSetting(chatId);
    
    // Reset processed messages when entering a new chat
    processedMessageIds.current.clear();
    
    return () => {
      // Clear active chat ID when leaving the screen
      setActiveChatId(null);
    };
  }, [chatId, setActiveChatId, user]);
  
  // Clear processed messages when auto-translate is toggled on
  // This allows re-translation of existing messages
  useEffect(() => {
    if (isAutoTranslateEnabled) {
      console.log('[ChatScreen] Auto-translate enabled - clearing processed message IDs');
      processedMessageIds.current.clear();
    }
  }, [isAutoTranslateEnabled]); // Watch the extracted value
  
  // Batch auto-translate effect
  // Instead of letting each MessageBubble translate individually,
  // we batch translate all foreign messages at once for much better performance
  useEffect(() => {
    const userLanguage = translationStore.userLanguage;
    
    console.log(`[ChatScreen] Auto-translate effect triggered. Enabled: ${isAutoTranslateEnabled}, Messages: ${chatMessages.length}`);
    
    if (!isAutoTranslateEnabled || !chatMessages.length) return;
    
    // Find messages that need translation (foreign language, not sent by user, not already translated)
    const messagesToTranslate = chatMessages.filter(msg => {
      const needsTranslation = 
        msg.senderId !== user?.uid && // Not our own messages
        msg.text && 
        msg.detectedLanguage && 
        msg.detectedLanguage !== userLanguage &&
        !translationStore.translations[msg.id]?.[userLanguage] && // Not already translated
        !processedMessageIds.current.has(msg.id); // Not already processed (prevent infinite loop)
      
      if (msg.detectedLanguage && msg.detectedLanguage !== userLanguage) {
        console.log(`[ChatScreen] Message ${msg.id}: needsTranslation=${needsTranslation}, detectedLang=${msg.detectedLanguage}, cached=${!!translationStore.translations[msg.id]?.[userLanguage]}, processed=${processedMessageIds.current.has(msg.id)}`);
      }
      
      return needsTranslation;
    });
    
    if (messagesToTranslate.length === 0) {
      console.log('[ChatScreen] No messages need translation');
      return;
    }
    
    console.log(`[ChatScreen] Batch auto-translating ${messagesToTranslate.length} messages`);
    
    // Mark these messages as processed BEFORE translating to prevent re-triggering
    messagesToTranslate.forEach(msg => processedMessageIds.current.add(msg.id));
    
    // Batch translate all messages at once
    const batchData = messagesToTranslate.map(msg => ({
      id: msg.id,
      text: msg.text,
      sourceLanguage: msg.detectedLanguage
    }));
    
    translationStore.batchTranslateMessages(batchData, userLanguage).catch(error => {
      console.error('[ChatScreen] Batch auto-translate failed:', error);
      // Remove from processed set on error so we can retry
      messagesToTranslate.forEach(msg => processedMessageIds.current.delete(msg.id));
    });
  }, [chatId, chatMessages, user?.uid]); // Changed to full chatMessages array to catch all changes
  
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
  
  // Subscribe to group chat participant data and presence
  useEffect(() => {
    if (!currentChat || currentChat.type !== 'group' || !user) {
      setParticipantUsers([]);
      return;
    }
    
    const unsubscribers: (() => void)[] = [];
    const participantIds = currentChat.participants.filter(uid => uid !== user.uid);
    
    // STEP 1: Load participant data from cache IMMEDIATELY (works offline)
    const loadParticipantsFromCache = async () => {
      const loadedParticipants: typeof participantUsers = [];
      
      // Load all participants in parallel
      await Promise.all(
        participantIds.map(async (uid) => {
          try {
            const userDocRef = doc(firestore, 'users', uid);
            // getDoc will use cache when offline
            const userSnap = await getDoc(userDocRef);
            
            if (userSnap.exists()) {
              const data = userSnap.data();
              
              const userProfile = {
                uid: userSnap.id,
                email: data.email || '',
                displayName: data.displayName || 'Unknown User',
                photoURL: data.photoURL || null,
                isOnline: false, // Will be updated by RTDB if online
                lastSeen: data.lastSeen?.toDate() ?? new Date(),
                avatarColor: data.avatarColor,
                createdAt: data.createdAt?.toDate() || new Date(),
              };
              
              loadedParticipants.push(userProfile);
              
              // Cache this user profile for offline access
              try {
                const { cacheUserProfiles } = await import('../services/storageService');
                await cacheUserProfiles([userProfile]);
              } catch (cacheError) {
                console.error('Error caching user profile:', cacheError);
              }
            } else {
              // Not in cache - add placeholder
              loadedParticipants.push({
                uid: uid,
                email: '',
                displayName: 'Unknown User',
                photoURL: null,
                isOnline: false,
                lastSeen: new Date(),
                avatarColor: undefined,
                createdAt: new Date(),
              });
            }
          } catch (error: any) {
            // If offline, try to load from AsyncStorage cache
            if (error?.code === 'unavailable' || 
                error?.message?.includes('offline') ||
                error?.message?.includes('network')) {
              
              try {
                const { getCachedUserProfile } = await import('../services/storageService');
                const cachedUser = await getCachedUserProfile(uid);
                
                if (cachedUser) {
                  loadedParticipants.push({
                    ...cachedUser,
                    isOnline: false, // Will be updated by RTDB if online
                  });
                  return; // Successfully loaded from cache, return early
                }
              } catch (cacheError) {
                console.error('Error loading user from AsyncStorage cache:', cacheError);
              }
            }
            
            // Add placeholder on error
            loadedParticipants.push({
              uid: uid,
              email: '',
              displayName: 'Unknown User',
              photoURL: null,
              isOnline: false,
              lastSeen: new Date(),
              avatarColor: undefined,
              createdAt: new Date(),
            });
          }
        })
      );
      
      // Set all participants at once (prevents race conditions)
      setParticipantUsers(loadedParticipants);
    };
    
    // Load from cache immediately
    loadParticipantsFromCache();
    
    // STEP 2: Set up real-time listeners for updates (only update existing entries, don't add new ones)
    participantIds.forEach(uid => {
      const userDocRef = doc(firestore, 'users', uid);
      const firestoreUnsub = onSnapshot(
        userDocRef, 
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            // Only update if user already exists in state (added by cache load)
            setParticipantUsers(prev => {
              const existing = prev.find(u => u.uid === uid);
              if (!existing) {
                return prev; // Don't add yet, wait for cache load
              }
              
              const others = prev.filter(u => u.uid !== uid);
              return [...others, {
                uid: docSnap.id,
                email: data.email || '',
                displayName: data.displayName || 'Unknown User',
                photoURL: data.photoURL || null,
                isOnline: isConnected ? (existing?.isOnline ?? data.isOnline ?? false) : false,
                lastSeen: existing?.lastSeen ?? data.lastSeen?.toDate() ?? new Date(),
                avatarColor: data.avatarColor,
                createdAt: data.createdAt?.toDate() || new Date(),
              }];
            });
          }
        },
        () => {
          // Errors are expected when offline - cache load already handled this
        }
      );
      unsubscribers.push(firestoreUnsub);
    });
    
    // Set up RTDB listeners AFTER a short delay to ensure Firestore data is loaded
    const rtdbTimeout = setTimeout(() => {
      participantIds.forEach(uid => {
        const statusRef = ref(database, `/status/${uid}`);
        const rtdbUnsub = onValue(
          statusRef,
          (snapshot) => {
            const status = snapshot.val();
            const isOnline = status ? status.state === 'online' : false;
            setParticipantUsers(prev => {
              if (prev.length === 0) {
                return prev;
              }
              const updated = prev.map(u =>
                u.uid === uid
                  ? { 
                      ...u, 
                      isOnline, 
                      lastSeen: status?.last_changed ? new Date(status.last_changed) : u.lastSeen 
                    }
                  : u
              );
              return updated;
            });
          },
          (error) => {
            console.error(`[ChatScreen] ❌ ERROR subscribing to RTDB for group participant ${uid}:`, error);
          }
        );
        unsubscribers.push(rtdbUnsub);
      });
    }, 500); // 500ms delay to let Firestore load
    
    return () => {
      clearTimeout(rtdbTimeout);
      unsubscribers.forEach(unsub => unsub());
    };
  }, [currentChat?.id, currentChat?.type, user?.uid, isConnected]);
  
  // Update participant online status when network connection changes
  useEffect(() => {
    if (!isConnected && participantUsers.length > 0) {
      // If we go offline, immediately show all participants as offline
      setParticipantUsers(prev => 
        prev.map(u => ({ ...u, isOnline: false }))
      );
    }
  }, [isConnected, participantUsers.length]);
  
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
  
  // Load other user's profile for direct chats (for display name only - presence comes from chat object)
  useEffect(() => {
    if (!currentChat || currentChat.type !== 'direct' || !user) {
      setOtherUser(null);
      return;
    }
    
    const otherUserId = currentChat.participants.find(p => p !== user.uid);
    if (!otherUserId) {
      setOtherUser(null);
      return;
    }
    
    // Just load the user profile - presence is already tracked in currentChat object
    const userDocRef = doc(firestore, 'users', otherUserId);
    const unsubscribe = onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setOtherUser({
          uid: doc.id,
          email: data.email || '',
          displayName: data.displayName || '',
          photoURL: data.photoURL || null,
          isOnline: directChatOnlineStatus ?? false, // Use presence from chat object
          lastSeen: directChatLastSeen || data.lastSeen?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
        });
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, [currentChat?.id, user?.uid, directChatOnlineStatus, directChatLastSeen]);

  // Subscribe to messages on mount
  useEffect(() => {
    subscribeToMessages(chatId);
    
    return () => {
      unsubscribeFromMessages(chatId);
    };
  }, [chatId, subscribeToMessages, unsubscribeFromMessages]);

  // Track which messages we've already started detecting
  const detectingRef = useRef<Set<string>>(new Set());

  // Detect language for new messages
  useEffect(() => {
    if (!user) return;

    chatMessages.forEach((message) => {
      // Skip if already processing or has language
      if (
        !message.text ||
        !message.text.trim() ||
        message.detectedLanguage ||
        message.pending ||
        message.tempId ||
        !message.id ||
        detectingRef.current.has(message.id)
      ) {
        return;
      }

      // Mark as detecting
      detectingRef.current.add(message.id);

      console.log(`[DETECT] Processing: ${message.id} - "${message.text}"`);

      // Detect async
      (async () => {
        try {
          const detected = await translationStore.detectLanguage(message.id, message.text);
          console.log(`[DETECT] Got: ${detected}`);
          const messageRef = doc(firestore, `chats/${chatId}/messages`, message.id);
          await setDoc(messageRef, { detectedLanguage: detected }, { merge: true });
          console.log(`[DETECT] Saved`);
        } catch (error: any) {
          console.log(`[DETECT] Error: ${error?.message}`);
          detectingRef.current.delete(message.id); // Allow retry
        }
      })();
    });
  }, [chatMessages, user, chatId]);

  // Subscribe to typing indicators
  useEffect(() => {
    if (!user) return;
    
    // Track the latest request to avoid race conditions
    let latestRequestId = 0;
    
    const unsubscribe = typingService.subscribeToTypingIndicators(
      chatId,
      user.uid,
      (userIds) => {
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
                setTypingUserNames(namesList);
              }
            })
            .catch(err => console.error('Error loading typing user names:', err));
        } else {
          setTypingUserNames([]);
        }
      }
    );
    
    return () => {
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
  
  const handleImagePick = async () => {
    if (!user) return;
    
    try {
      const { pickImage } = await import('../services/imageService');
      const imageAsset = await pickImage();
      
      if (!imageAsset) {
        return; // User canceled
      }
      
      // Send image with optimistic upload
      await sendImageOptimistic(
        chatId,
        imageAsset.uri,
        '', // Optional caption (could add UI for this later)
        user.uid,
        imageAsset.width,
        imageAsset.height
      );
    } catch (error) {
      console.error('Error picking/sending image:', error);
    }
  };

  const handleTypingChange = (isTyping: boolean) => {
    if (!user) return;
    
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

  // AI Feature Handlers
  const handleCulturalContext = async (messageId: string, text: string, language: string) => {
    setSelectedMessageForContext({ id: messageId, text, detectedLanguage: language } as Message);
    setShowCulturalContextModal(true);
    
    try {
      await translationStore.getCulturalContext(messageId, text, language);
    } catch (error) {
      console.error('Error getting cultural context:', error);
    }
  };

  const handleSlangExplanation = async (messageId: string, text: string, language: string) => {
    setSelectedMessageForContext({ id: messageId, text, detectedLanguage: language } as Message);
    setShowSlangModal(true);
    
    try {
      await translationStore.getSlangExplanations(messageId, text, language);
    } catch (error) {
      console.error('Error getting slang explanations:', error);
    }
  };

  const handleSummary = async () => {
    if (!user || chatMessages.length < 5) {
      return;
    }

    setShowSummaryModal(true);

    try {
      // Build users map
      const usersMap: Record<string, User> = {};
      if (currentChat?.type === 'group') {
        participantUsers.forEach(u => {
          usersMap[u.uid] = u;
        });
      } else if (otherUser) {
        usersMap[otherUser.uid] = otherUser;
      }
      usersMap[user.uid] = user;

      await translationStore.getSummary(chatId, chatMessages, usersMap, true);
    } catch (error) {
      console.error('Error generating summary:', error);
    }
  };

  const handleShareSummaryToChat = (text: string) => {
    if (user) {
      handleSend(text);
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
        autoTranslateEnabled={translationStore.isAutoTranslateEnabled(chatId)}
        onReadReceiptPress={isSent ? () => handleReadReceiptPress(item) : undefined}
        onRetry={item.failed && item.tempId ? () => handleRetry(item.tempId!) : undefined}
        onCulturalContext={handleCulturalContext}
        onSlangExplanation={handleSlangExplanation}
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
                {participantUsers.map((participant, index) => (
                  <View key={participant.uid} style={styles.participantItem}>
                    <OnlineIndicator 
                      isOnline={participant.isOnline}
                      lastSeen={participant.lastSeen}
                      showText={false}
                      size="small"
                      isUnknown={!isConnected}
                    />
                    <Text style={styles.participantName}>
                      {participant.displayName}
                      {index < participantUsers.length - 1 ? ', ' : ''}
                    </Text>
                  </View>
                ))}
              </View>
            ) : otherUser ? (
              <View style={styles.presenceContainer}>
                <OnlineIndicator 
                  isOnline={isConnected ? otherUser.isOnline : false}
                  lastSeen={otherUser.lastSeen}
                  showText={true}
                  size="small"
                  isUnknown={!isConnected}
                />
              </View>
            ) : null}
          </View>
          <View style={styles.headerRight}>
            {/* Auto-translate toggle */}
            <TouchableOpacity
              onPress={() => {
                const currentSetting = translationStore.isAutoTranslateEnabled(chatId);
                translationStore.setAutoTranslate(chatId, !currentSetting);
              }}
              style={[
                styles.autoTranslateButton,
                translationStore.isAutoTranslateEnabled(chatId) && styles.autoTranslateButtonActive
              ]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={[
                styles.autoTranslateIcon,
                translationStore.isAutoTranslateEnabled(chatId) && styles.autoTranslateIconActive
              ]}>
                🌐
              </Text>
            </TouchableOpacity>
            
            {/* Summary button */}
            <TouchableOpacity
              onPress={handleSummary}
              style={styles.summaryButton}
              disabled={chatMessages.length < 5}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={[
                styles.summaryButtonText,
                chatMessages.length < 5 && styles.summaryButtonDisabled
              ]}>
                📝
              </Text>
            </TouchableOpacity>
          </View>
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
        onImagePick={handleImagePick}
        onTypingChange={handleTypingChange}
        disabled={!user} 
      />
      
      {/* Read Receipt Modal */}
      <ReadReceiptModal
        visible={showReadReceiptModal}
        message={selectedMessage}
        participants={participants}
        userNames={senderNames}
        participantUsers={participantUsers}
        onClose={() => {
          setShowReadReceiptModal(false);
          setSelectedMessage(null);
        }}
      />

      {/* Cultural Context Modal */}
      <CulturalContextModal
        visible={showCulturalContextModal}
        context={selectedMessageForContext ? translationStore.culturalContexts[selectedMessageForContext.id] : null}
        loading={selectedMessageForContext ? translationStore.loadingCulturalContext[selectedMessageForContext.id] || false : false}
        error={selectedMessageForContext ? translationStore.errors[`cultural_${selectedMessageForContext.id}`] : null}
        onClose={() => {
          setShowCulturalContextModal(false);
          setSelectedMessageForContext(null);
        }}
        onRetry={() => selectedMessageForContext && handleCulturalContext(
          selectedMessageForContext.id,
          selectedMessageForContext.text,
          selectedMessageForContext.detectedLanguage || translationStore.userLanguage
        )}
      />

      {/* Slang Explanation Modal */}
      <SlangExplanationModal
        visible={showSlangModal}
        explanations={selectedMessageForContext ? translationStore.slangExplanations[selectedMessageForContext.id] : null}
        loading={selectedMessageForContext ? translationStore.loadingSlangExplanations[selectedMessageForContext.id] || false : false}
        error={selectedMessageForContext ? translationStore.errors[`slang_${selectedMessageForContext.id}`] : null}
        onClose={() => {
          setShowSlangModal(false);
          setSelectedMessageForContext(null);
        }}
        onRetry={() => selectedMessageForContext && handleSlangExplanation(
          selectedMessageForContext.id,
          selectedMessageForContext.text,
          selectedMessageForContext.detectedLanguage || translationStore.userLanguage
        )}
      />

      {/* Multilingual Summary Modal */}
      <MultilingualSummaryModal
        visible={showSummaryModal}
        summary={translationStore.summaries[chatId] || null}
        loading={translationStore.loadingSummary[chatId] || false}
        error={translationStore.errors[`summary_${chatId}`] || null}
        onClose={() => setShowSummaryModal(false)}
        onRetry={handleSummary}
        onShareToChat={handleShareSummaryToChat}
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 80, // Increased to accommodate both buttons
  },
  autoTranslateButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  autoTranslateButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  autoTranslateIcon: {
    fontSize: 16,
  },
  autoTranslateIconActive: {
    // Can add any style changes for active state
  },
  summaryButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
  },
  summaryButtonText: {
    fontSize: 20,
  },
  summaryButtonDisabled: {
    opacity: 0.3,
  },
  aiButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
  },
  aiButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
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
