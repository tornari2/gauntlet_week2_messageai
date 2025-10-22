/**
 * Login Screen
 * Allows users to sign in with email and password
 */

import React, { useState, useEffect, useReducer, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { Colors } from '../constants/Colors';
import { ErrorToast } from '../components/ErrorToast';

interface LoginScreenProps {
  navigation: any;
}

type ErrorAction = 
  | { type: 'SET_ERROR'; message: string }
  | { type: 'CLEAR_ERROR' };

const errorReducer = (state: { message: string; timestamp: number } | null, action: ErrorAction) => {
  console.log('🔄 Reducer called with action:', action.type, action);
  
  switch (action.type) {
    case 'SET_ERROR':
      const newState = { message: action.message, timestamp: Date.now() };
      console.log('🔄 Reducer returning new error state:', newState);
      return newState;
    case 'CLEAR_ERROR':
      console.log('🔄 Reducer clearing error');
      return null;
    default:
      return state;
  }
};

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  const [renderTrigger, setRenderTrigger] = useState(0);
  const errorRef = useRef<{ message: string; timestamp: number } | null>(null);

  const { login } = useAuthStore();

  // Track when component mounts/unmounts
  useEffect(() => {
    console.log('🏗️  LoginScreen mounted');
    return () => {
      console.log('💥 LoginScreen unmounting');
    };
  }, []);

  // Track render trigger changes (which indicate error changes)
  useEffect(() => {
    console.log('📊 Render trigger changed, current error:', errorRef.current);
  }, [renderTrigger]);

  const handleLogin = async () => {
    console.log('🔐 Login pressed - email:', email, 'password:', password ? '***' : 'empty');

    // Validation
    if (!email.trim() || !password.trim()) {
      const msg = 'Please enter both email and password';
      console.log('❌ Validation failed, setting error via ref:', msg);
      errorRef.current = { message: msg, timestamp: Date.now() };
      setRenderTrigger(prev => prev + 1);
      console.log('✅ Error set in ref, triggered re-render');
      return;
    }

    // Clear error before attempting login
    errorRef.current = null;
    setRenderTrigger(prev => prev + 1);

    try {
      setLocalLoading(true);
      await login(email.trim(), password);
      setLocalLoading(false);
      // Navigation will happen automatically when auth state changes
    } catch (err: any) {
      setLocalLoading(false);
      const errorMsg = err.message || 'An error occurred during login';
      console.log('❌ Login failed, setting error via ref:', errorMsg);
      console.log('🎬 About to set error in ref and trigger render');
      errorRef.current = { message: errorMsg, timestamp: Date.now() };
      console.log('📝 Error stored in ref:', errorRef.current);
      setRenderTrigger(prev => {
        const newValue = prev + 1;
        console.log('🔔 Triggering render:', prev, '=>', newValue);
        return newValue;
      });
      console.log('✅ Render trigger updated');
    }
  };

  const navigateToSignup = () => {
    navigation.navigate('Signup');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!localLoading}
            testID="email-input"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            editable={!localLoading}
            testID="password-input"
          />

          <TouchableOpacity
            style={[styles.button, localLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={localLoading}
            testID="login-button"
          >
            {localLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Login</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity
            onPress={navigateToSignup}
            disabled={localLoading}
            testID="signup-link"
          >
            <Text style={styles.linkText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Error Toast Popup */}
      <ErrorToast 
        message={errorRef.current?.message || null} 
        onDismiss={() => {
          errorRef.current = null;
          setRenderTrigger(prev => prev + 1);
        }} 
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  form: {
    marginBottom: 24,
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
  },
  button: {
    height: 56,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
  },
  linkText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
});

