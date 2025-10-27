/**
 * UserSelector Component
 * 
 * Multi-select user list with search functionality and selected user chips
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { firestore } from '../services/firebase';
import { User } from '../types';
import { Colors } from '../constants/Colors';
import { getUserAvatarColor } from '../utils/userColors';

interface UserSelectorProps {
  currentUserId: string;
  selectedUserIds: string[];
  onSelectionChange: (userIds: string[]) => void;
  excludeUserIds?: string[];
}

export function UserSelector({
  currentUserId,
  selectedUserIds,
  onSelectionChange,
  excludeUserIds = [],
}: UserSelectorProps) {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    // Filter users based on search query
    if (searchQuery.trim() === '') {
      setFilteredUsers(allUsers);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredUsers(
        allUsers.filter((user) =>
          user.displayName.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, allUsers]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Try to load from Firestore first
      const usersRef = collection(firestore, 'users');
      const usersSnapshot = await getDocs(usersRef);
      
      const users: User[] = [];
      usersSnapshot.forEach((doc) => {
        const userData = doc.data() as User;
        // IMPORTANT: The UID is the document ID, not in the data
        const userWithId = {
          ...userData,
          uid: doc.id, // Use document ID as UID
        };
        
        // Exclude current user and any other excluded users
        if (
          userWithId.uid !== currentUserId &&
          !excludeUserIds.includes(userWithId.uid)
        ) {
          users.push(userWithId);
        }
      });
      
      // Cache the loaded users
      if (users.length > 0) {
        const { cacheUserProfiles } = await import('../services/storageService');
        await cacheUserProfiles(users);
      }
      
      // Sort by display name
      users.sort((a, b) => a.displayName.localeCompare(b.displayName));
      
      setAllUsers(users);
      setFilteredUsers(users);
    } catch (error: any) {
      console.error('Error loading users:', error);
      
      // If offline or network error, try to load from cache
      if (error?.code === 'unavailable' || 
          error?.message?.includes('offline') ||
          error?.message?.includes('network')) {
        try {
          const { getCachedUserProfiles } = await import('../services/storageService');
          const cachedUsers = await getCachedUserProfiles();
          
          // Filter out current user and excluded users
          const filteredCachedUsers = cachedUsers.filter(
            user => user.uid !== currentUserId && !excludeUserIds.includes(user.uid)
          );
          
          // Sort by display name
          filteredCachedUsers.sort((a, b) => a.displayName.localeCompare(b.displayName));
          
          setAllUsers(filteredCachedUsers);
          setFilteredUsers(filteredCachedUsers);
        } catch (cacheError) {
          console.error('Error loading users from cache:', cacheError);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      onSelectionChange(selectedUserIds.filter((id) => id !== userId));
    } else {
      onSelectionChange([...selectedUserIds, userId]);
    }
  };

  const renderUserItem = ({ item }: { item: User }) => {
    const isSelected = selectedUserIds.includes(item.uid);

    return (
      <TouchableOpacity
        style={[styles.userItem, isSelected && styles.userItemSelected]}
        onPress={() => toggleUserSelection(item.uid)}
        testID={`user-item-${item.uid}`}
      >
        <View style={styles.userInfo}>
          <View style={[
            styles.avatarPlaceholder,
            { backgroundColor: getUserAvatarColor(item) }
          ]}>
            <Text style={styles.avatarText}>
              {item.displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{item.displayName}</Text>
            <Text style={styles.userEmail}>{item.email}</Text>
          </View>
        </View>
        {isSelected && (
          <View style={styles.checkmark}>
            <Text style={styles.checkmarkText}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Optimize FlatList performance with getItemLayout
  const getUserItemLayout = (_: any, index: number) => ({
    length: 76, // User item height (48 avatar + 12*2 padding + 4 margin)
    offset: 76 * index,
    index,
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Selected user chips */}
      {selectedUserIds.length > 0 && (
        <View style={styles.chipsContainer}>
          {selectedUserIds.map((userId) => {
            const user = allUsers.find((u) => u.uid === userId);
            if (!user) return null;

            return (
              <View key={`chip-${userId}`} style={styles.chip}>
                <Text style={styles.chipText}>{user.displayName}</Text>
                <TouchableOpacity
                  onPress={() => toggleUserSelection(userId)}
                  style={styles.chipRemove}
                  testID={`remove-chip-${userId}`}
                >
                  <Text style={styles.chipRemoveText}>×</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}

      {/* Search input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          testID="user-search-input"
        />
      </View>

      {/* User list */}
      <FlatList
        data={filteredUsers}
        renderItem={renderUserItem}
        keyExtractor={(item) => item.uid}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery ? 'No users found' : 'No users available'}
            </Text>
          </View>
        }
        // Performance optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={10}
        updateCellsBatchingPeriod={50}
        getItemLayout={getUserItemLayout}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  chipRemove: {
    marginLeft: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipRemoveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  searchContainer: {
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    height: 40,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  listContainer: {
    paddingVertical: 8,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  userItemSelected: {
    backgroundColor: '#f0f9f4',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});

