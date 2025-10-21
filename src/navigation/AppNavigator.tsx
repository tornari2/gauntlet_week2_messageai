/**
 * App Navigator
 * Main navigation setup with conditional auth/main routing
 */

import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
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
      <ActivityIndicator size="large" color="#25D366" />
    </View>
  );
};

/**
 * Root navigator with conditional rendering
 */
export const AppNavigator = () => {
  const { user, loading, initialized, initialize } = useAuthStore();

  useEffect(() => {
    // Initialize auth state on mount
    initialize();
  }, [initialize]);

  // Show loading screen while initializing
  if (loading || !initialized) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
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

