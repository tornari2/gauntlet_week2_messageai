/**
 * NotificationBanner Component
 * 
 * In-app banner that displays notifications when messages arrive while the app is open.
 * Mimics the behavior of push notifications with a dismissible banner at the top.
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';

const BANNER_HEIGHT = 80;
const ANIMATION_DURATION = 300;
const AUTO_DISMISS_DELAY = 4000;

export interface NotificationData {
  id: string;
  title: string;
  body: string;
  chatId?: string;
  senderId?: string;
  timestamp: number;
}

interface NotificationBannerProps {
  notification: NotificationData | null;
  onDismiss: () => void;
  onPress?: (notification: NotificationData) => void;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  notification,
  onDismiss,
  onPress,
}) => {
  const slideAnim = useRef(new Animated.Value(-BANNER_HEIGHT)).current;
  const insets = useSafeAreaInsets();
  const autoDismissTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (notification) {
      // Clear any existing timer
      if (autoDismissTimer.current) {
        clearTimeout(autoDismissTimer.current);
      }

      // Slide in animation
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
      // Slide out animation
      Animated.timing(slideAnim, {
        toValue: -BANNER_HEIGHT,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }).start();
    }

    return () => {
      if (autoDismissTimer.current) {
        clearTimeout(autoDismissTimer.current);
      }
    };
  }, [notification]);

  const handleDismiss = () => {
    if (autoDismissTimer.current) {
      clearTimeout(autoDismissTimer.current);
    }

    Animated.timing(slideAnim, {
      toValue: -BANNER_HEIGHT,
      duration: ANIMATION_DURATION,
      useNativeDriver: true,
    }).start(() => {
      onDismiss();
    });
  };

  const handlePress = () => {
    if (notification && onPress) {
      handleDismiss();
      onPress(notification);
    }
  };

  if (!notification) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 8,
          transform: [{ translateY: slideAnim }],
        },
      ]}
      pointerEvents="box-none" // Allow touches to pass through when not interacting with banner
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handlePress}
        style={styles.content}
      >
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>💬</Text>
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {notification.title}
          </Text>
          <Text style={styles.body} numberOfLines={2}>
            {notification.body}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleDismiss}
          style={styles.dismissButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.dismissText}>✕</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
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
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  body: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
  },
  dismissButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
  },
  dismissText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '600',
  },
});

