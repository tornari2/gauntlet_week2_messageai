/**
 * ChatsListScreen
 * 
 * Main screen showing user's chat list
 * Features:
 * - FlatList of chats
 * - Real-time updates
 * - Loading and empty states
 * - Logout button in header
 */

import React, { useEffect } from 'react';
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { MainStackParamList } from '../navigation/AppNavigator';
import { useChatStore } from '../stores/chatStore';
import { useAuthStore } from '../stores/authStore';
import { useTranslationStore } from '../stores/translationStore';
import { SwipeableChatListItem } from '../components/SwipeableChatListItem';
import { Chat } from '../types';
import { Colors } from '../constants/Colors';
import i18n from '../i18n';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

export const ChatsListScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { chats, loading, subscribeToChats } = useChatStore();
  const { user, logout } = useAuthStore();
  const userLanguage = useTranslationStore((state) => state.userLanguage); // Subscribe to language changes

  useEffect(() => {
    if (!user) return;

    // Subscribe to user's chats
    const unsubscribe = subscribeToChats(user.uid);

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [user, subscribeToChats]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const renderChatItem = ({ item }: { item: Chat }) => (
    <SwipeableChatListItem chat={item} />
  );

  // Fixed item layout to prevent re-calculations and flicker
  const getItemLayout = (_: any, index: number) => ({
    length: 88, // Height of ChatListItem (padding 16 * 2 + avatar 56)
    offset: 88 * index,
    index,
  });

  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>{i18n.t('common.loading')}</Text>
        </View>
      );
    }

    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyIcon}>💬</Text>
        <Text style={styles.emptyTitle}>{i18n.t('chatList.noChats')}</Text>
        <Text style={styles.emptySubtitle}>
          {i18n.t('chatList.startChatting')}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header with logout button */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{i18n.t('chatList.title')}</Text>
          <TouchableOpacity
            onPress={handleLogout}
            style={styles.logoutButton}
            testID="logout-button"
          >
            <Text style={styles.logoutText}>{i18n.t('profile.logout')}</Text>
          </TouchableOpacity>
        </View>

      {/* Chats list */}
      <FlatList
        data={chats}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.id}
        getItemLayout={getItemLayout}
        contentContainerStyle={chats.length === 0 ? styles.emptyList : undefined}
        ListEmptyComponent={renderEmptyState}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={10}
      />

      {/* Floating action button for profile (bottom left) */}
      <TouchableOpacity
        style={[styles.fab, styles.fabProfile]}
        onPress={() => navigation.navigate('UserProfile')}
        testID="profile-button"
      >
        <Ionicons name="person" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Floating action button for creating new chats */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('NewChat')}
        testID="new-chat-button"
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
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
    backgroundColor: '#F5F5F5', // Light gray background (matches UserProfileScreen)
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
  },
  logoutText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primaryDark, // Brown color (matches profile button)
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  fabProfile: {
    left: 20,
    right: 'auto', // Override right position
    bottom: 20,
    backgroundColor: Colors.primaryDark,
  },
  fabIcon: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '300',
    lineHeight: 32,
  },
});

