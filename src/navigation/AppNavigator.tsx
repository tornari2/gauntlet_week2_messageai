/**
 * App Navigator
 * Main navigation setup with conditional auth/main routing and deep linking
 */

import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import { useAuthStore } from '../stores/authStore';
import { LoginScreen } from '../screens/LoginScreen';
import { SignupScreen } from '../screens/SignupScreen';
import { ChatsListScreen } from '../screens/ChatsListScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { NewChatScreen } from '../screens/NewChatScreen';
import { CreateGroupScreen } from '../screens/CreateGroupScreen';

// Type definitions for navigation
export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type MainStackParamList = {
  ChatsList: undefined;
  NewChat: undefined;
  CreateGroup: undefined;
  Chat: {
    chatId: string;
    chatName: string;
  };
};

const Stack = createNativeStackNavigator();

/**
 * Auth Stack - Screens for unauthenticated users
 */
const AuthStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
  );
};

/**
 * Main Stack - Screens for authenticated users
 */
const MainStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="ChatsList"
        component={ChatsListScreen}
        options={{ title: 'Chats' }}
      />
      <Stack.Screen
        name="NewChat"
        component={NewChatScreen}
        options={{ title: 'New Chat' }}
      />
      <Stack.Screen
        name="CreateGroup"
        component={CreateGroupScreen}
        options={{ title: 'Create Group' }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{ title: 'Chat' }}
      />
    </Stack.Navigator>
  );
};

/**
 * Loading screen while initializing auth
 */
const LoadingScreen = () => {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color="#D4A574" />
    </View>
  );
};

/**
 * Root navigator with conditional rendering and notification deep linking
 */
export const AppNavigator = () => {
  const { user, loading, initialized, initialize } = useAuthStore();
  const navigationRef = useRef<NavigationContainerRef<any>>(null);
  const notificationResponseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    // Initialize auth state on mount
    initialize();
  }, [initialize]);

  // Handle notification taps for deep linking
  useEffect(() => {
    // Listen for notification responses (when user taps notification)
    notificationResponseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const chatId = response.notification.request.content.data?.chatId;
        const chatName = response.notification.request.content.data?.chatName || 'Chat';

        if (chatId && navigationRef.current?.isReady()) {
          // Navigate to the specific chat
          navigationRef.current?.navigate('Chat', { chatId, chatName });
        }
      }
    );

    return () => {
      if (notificationResponseListener.current) {
        notificationResponseListener.current.remove();
      }
    };
  }, []);

  // Show loading screen while initializing
  if (loading || !initialized) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      {user ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

