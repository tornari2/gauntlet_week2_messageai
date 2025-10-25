/**
 * NewChatScreen
 * 
 * Screen for creating new chats (direct or group)
 * Features:
 * - List of all users with multi-select
 * - Search functionality
 * - Create direct chat with 1 selected user
 * - Create group chat with 2+ selected users
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../navigation/AppNavigator';
import { getAllUsers } from '../services/authService';
import { useAuthStore } from '../stores/authStore';
import { useChatStore } from '../stores/chatStore';
import { useNetworkStore } from '../stores/networkStore';
import { User } from '../types';
import { Colors } from '../constants/Colors';
import { getUserAvatarColor } from '../utils/userColors';
import { OnlineIndicator } from '../components/OnlineIndicator';
import { ref, onValue } from 'firebase/database';
import { database } from '../services/firebase';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

export const NewChatScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuthStore();
  const { createOrGetDirectChat, createGroupChat } = useChatStore();
  const isConnected = useNetworkStore((state) => state.isConnected);
  
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [creatingChat, setCreatingChat] = useState(false);
  const [userPresence, setUserPresence] = useState<Record<string, boolean>>({});
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [showGroupNameModal, setShowGroupNameModal] = useState(false);
  const [groupName, setGroupName] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  // Subscribe to presence updates for all users using Realtime Database
  useEffect(() => {
    if (users.length === 0) return;

    const unsubscribers: (() => void)[] = [];

    // Subscribe to each user's presence in Realtime Database (source of truth)
    users.forEach((u) => {
      const statusRef = ref(database, `/status/${u.uid}`);
      const unsubscribe = onValue(
        statusRef,
        (snapshot) => {
          const status = snapshot.val();
          const isOnline = status ? status.state === 'online' : false;
          
          setUserPresence((prev) => ({
            ...prev,
            [u.uid]: isOnline,
          }));
        },
        (error) => {
          console.error(`Error subscribing to presence for ${u.uid}:`, error);
          // On error, set user as offline
          setUserPresence((prev) => ({
            ...prev,
            [u.uid]: false,
          }));
        }
      );

      unsubscribers.push(unsubscribe);
    });

    // Cleanup subscriptions
    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [users]);

  useEffect(() => {
    // Filter users based on search query
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(
        (u) =>
          u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  const loadUsers = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const allUsers = await getAllUsers(user.uid);
      setUsers(allUsers);
      setFilteredUsers(allUsers);
      
      // Initialize all users as offline until RTDB confirms they're online
      const initialPresence: Record<string, boolean> = {};
      allUsers.forEach(u => {
        initialPresence[u.uid] = false;
      });
      setUserPresence(initialPresence);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserPress = (selectedUser: User) => {
    // Toggle selection instead of immediately creating chat
    setSelectedUserIds(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(selectedUser.uid)) {
        newSelection.delete(selectedUser.uid);
      } else {
        newSelection.add(selectedUser.uid);
      }
      return newSelection;
    });
  };

  const handleCreateChat = async () => {
    if (!user || creatingChat || selectedUserIds.size === 0) return;

    const selectedUsersArray = Array.from(selectedUserIds);

    if (selectedUsersArray.length === 1) {
      // Create direct chat immediately
      try {
        setCreatingChat(true);
        const otherUserId = selectedUsersArray[0];
        const chatId = await createOrGetDirectChat(user.uid, otherUserId);
        const selectedUser = users.find(u => u.uid === otherUserId);
        
        // Navigate to the chat
        navigation.replace('Chat', {
          chatId,
          chatName: selectedUser?.displayName || 'Unknown User',
        });
      } catch (error) {
        console.error('Error creating chat:', error);
        Alert.alert('Error', 'Failed to create chat. Please try again.');
      } finally {
        setCreatingChat(false);
      }
    } else {
      // Show modal to name the group chat
      const selectedUsers = users.filter(u => selectedUsersArray.includes(u.uid));
      const defaultName = selectedUsers.map(u => u.displayName).join(', ');
      setGroupName(defaultName);
      setShowGroupNameModal(true);
    }
  };

  const handleCreateGroupChat = async () => {
    if (!user || !groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    try {
      setCreatingChat(true);
      setShowGroupNameModal(false);
      
      const selectedUsersArray = Array.from(selectedUserIds);
      const chatId = await createGroupChat(user.uid, selectedUsersArray, groupName.trim());
      
      // Navigate to the group chat
      navigation.replace('Chat', {
        chatId,
        chatName: groupName.trim(),
      });
    } catch (error) {
      console.error('Error creating group chat:', error);
      Alert.alert('Error', 'Failed to create group chat. Please try again.');
    } finally {
      setCreatingChat(false);
    }
  };

  const renderUserItem = ({ item }: { item: User }) => {
    // Use real-time presence data if available, otherwise fall back to initial data
    const isOnline = userPresence[item.uid] !== undefined 
      ? userPresence[item.uid] 
      : (item.isOnline || false);
    
    const isSelected = selectedUserIds.has(item.uid);

    return (
      <TouchableOpacity
        style={[
          styles.userItem,
          isSelected && styles.userItemSelected,
        ]}
        onPress={() => handleUserPress(item)}
        disabled={creatingChat}
      >
        <View style={[
          styles.avatar,
          { backgroundColor: getUserAvatarColor(item) }
        ]}>
          <Text style={styles.avatarText}>
            {item.displayName.charAt(0).toUpperCase()}
          </Text>
          {isSelected && (
            <View style={styles.selectedBadge}>
              <Text style={styles.selectedBadgeText}>✓</Text>
            </View>
          )}
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.displayName}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
        </View>
        <OnlineIndicator 
          isOnline={isOnline}
          size="small"
          isUnknown={!isConnected}
        />
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
      );
    }

    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyIcon}>👥</Text>
        <Text style={styles.emptyTitle}>No Users Found</Text>
        <Text style={styles.emptySubtitle}>
          {searchQuery ? 'Try a different search' : 'No other users available'}
        </Text>
      </View>
    );
  };

  // Optimize FlatList performance with getItemLayout
  const getUserItemLayout = (_: any, index: number) => ({
    length: 82, // User item height (50 avatar + 16*2 padding)
    offset: 82 * index,
    index,
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Chat</Text>
          {selectedUserIds.size > 0 && (
            <Text style={styles.selectedCount}>
              {selectedUserIds.size} selected
            </Text>
          )}
        </View>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or email..."
          placeholderTextColor="#8e8e93"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* Users list */}
      <FlatList
        data={filteredUsers}
        renderItem={renderUserItem}
        keyExtractor={(item) => item.uid}
        contentContainerStyle={
          filteredUsers.length === 0 ? styles.emptyList : undefined
        }
        ListEmptyComponent={renderEmptyState}
        refreshing={loading}
        onRefresh={loadUsers}
        // Performance optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={10}
        updateCellsBatchingPeriod={50}
        getItemLayout={getUserItemLayout}
      />

      {/* Create Chat Button - Floating */}
      {selectedUserIds.size > 0 && (
        <View style={styles.createButtonContainer}>
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateChat}
            disabled={creatingChat}
          >
            <Text style={styles.createButtonText}>
              {creatingChat 
                ? 'Creating...' 
                : selectedUserIds.size === 1 
                  ? 'Start Chat' 
                  : `Create Group (${selectedUserIds.size})`
              }
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Loading overlay */}
      {creatingChat && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingOverlayText}>Creating chat...</Text>
        </View>
      )}

      {/* Group Name Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showGroupNameModal}
        onRequestClose={() => setShowGroupNameModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Name Your Group</Text>
            <Text style={styles.modalSubtitle}>
              Choose a name for your group chat
            </Text>
            
            <TextInput
              style={styles.modalInput}
              value={groupName}
              onChangeText={setGroupName}
              placeholder="Enter group name"
              placeholderTextColor="#8e8e93"
              autoFocus
              maxLength={50}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowGroupNameModal(false)}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCreate]}
                onPress={handleCreateGroupChat}
                disabled={!groupName.trim()}
              >
                <Text style={styles.modalButtonTextCreate}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      </View>
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
    backgroundColor: '#F5F5F5', // Light gray background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primaryDark,
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  backButtonText: {
    fontSize: 28,
    color: '#fff',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  selectedCount: {
    fontSize: 14,
    color: '#fff',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    fontWeight: '600',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  searchInput: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F5EBE0', // Light tan background (matches chat list items)
    borderBottomWidth: 1,
    borderBottomColor: '#E8D7C7', // Slightly darker tan for border
  },
  userItemSelected: {
    backgroundColor: '#E8D7C7', // Slightly darker tan for selected state
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    position: 'relative',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  selectedBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  selectedBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#8e8e93',
  },
  emptyList: {
    flexGrow: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8e8e93',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#8e8e93',
    textAlign: 'center',
    lineHeight: 22,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlayText: {
    marginTop: 16,
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  createButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  createButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#8e8e93',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  modalButtonCreate: {
    backgroundColor: Colors.primary,
  },
  modalButtonTextCancel: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonTextCreate: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

