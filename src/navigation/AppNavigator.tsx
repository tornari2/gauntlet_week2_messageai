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
 * (Placeholder for now, will be implemented in PR #3)
 */
const MainStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Home"
        component={PlaceholderScreen}
        options={{ title: 'Chats' }}
      />
    </Stack.Navigator>
  );
};

/**
 * Placeholder screen for authenticated users
 * Will be replaced with ChatsListScreen in PR #3
 */
const PlaceholderScreen = () => {
  const { logout, user } = useAuthStore();

  return (
    <View style={styles.placeholder}>
      <View style={styles.placeholderContent}>
        <View style={styles.welcomeBox}>
          <View style={styles.iconCircle}>
            <View style={styles.checkmark} />
          </View>
          <View style={styles.textContent}>
            <View style={styles.titleText} />
            <View style={styles.subtitleText} />
          </View>
        </View>
        <View style={styles.userInfoBox}>
          <View style={styles.infoRow}>
            <View style={styles.labelText} />
            <View style={styles.valueText} />
          </View>
          <View style={styles.infoRow}>
            <View style={styles.labelText} />
            <View style={styles.valueTextShort} />
          </View>
        </View>
        <View style={styles.buttonContainer}>
          <View style={styles.logoutButton} />
        </View>
      </View>
    </View>
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
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 24,
  },
  placeholderContent: {
    width: '100%',
    maxWidth: 400,
  },
  welcomeBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    alignSelf: 'center',
  },
  checkmark: {
    width: 24,
    height: 16,
    borderLeftWidth: 3,
    borderBottomWidth: 3,
    borderColor: '#fff',
    transform: [{ rotate: '-45deg' }],
    marginTop: -4,
  },
  textContent: {
    alignItems: 'center',
  },
  titleText: {
    width: 200,
    height: 28,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 12,
  },
  subtitleText: {
    width: 280,
    height: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  userInfoBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  infoRow: {
    marginBottom: 16,
  },
  labelText: {
    width: 80,
    height: 16,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 8,
  },
  valueText: {
    width: '100%',
    height: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  valueTextShort: {
    width: 180,
    height: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  buttonContainer: {
    marginTop: 8,
  },
  logoutButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#25D366',
    borderRadius: 12,
  },
});

