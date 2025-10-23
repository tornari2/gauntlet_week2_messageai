/**
 * ErrorToast Component
 * 
 * Animated toast notification for displaying error messages
 * Slides up from bottom with auto-dismiss
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';

const TOAST_HEIGHT = 120;
const ANIMATION_DURATION = 300;
const AUTO_DISMISS_DELAY = 4000;

interface ErrorToastProps {
  message: string | null;
  onDismiss: () => void;
}

export const ErrorToast: React.FC<ErrorToastProps> = ({ message, onDismiss }) => {
  const slideAnim = useRef(new Animated.Value(TOAST_HEIGHT)).current;
  const autoDismissTimer = useRef<NodeJS.Timeout | null>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (message) {
      // Clear any existing timer
      if (autoDismissTimer.current) {
        clearTimeout(autoDismissTimer.current);
      }

      // Slide up animation
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
        tension: 40,
      }).start();

      // Auto-dismiss after delay
      autoDismissTimer.current = setTimeout(() => {
        handleDismiss();
      }, AUTO_DISMISS_DELAY);
    } else {
      // Slide down animation
      Animated.timing(slideAnim, {
        toValue: TOAST_HEIGHT,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }).start();
    }

    return () => {
      if (autoDismissTimer.current) {
        clearTimeout(autoDismissTimer.current);
      }
    };
  }, [message]);

  const handleDismiss = () => {
    if (autoDismissTimer.current) {
      clearTimeout(autoDismissTimer.current);
    }

    Animated.timing(slideAnim, {
      toValue: TOAST_HEIGHT,
      duration: ANIMATION_DURATION,
      useNativeDriver: true,
    }).start(() => {
      onDismiss();
    });
  };

  if (!message) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          paddingBottom: insets.bottom > 0 ? insets.bottom : 20,
          transform: [{ translateY: slideAnim }],
        },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>⚠️</Text>
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Login Failed</Text>
          <Text style={styles.message} numberOfLines={2}>
            {message}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleDismiss}
          style={styles.dismissButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.dismissText}>✕</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFE5E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 20,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.error,
    marginBottom: 2,
  },
  message: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
  },
  dismissButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
  },
  dismissText: {
    fontSize: 18,
    color: '#666666',
    fontWeight: '600',
  },
});
