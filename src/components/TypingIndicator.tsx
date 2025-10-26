/**
 * TypingIndicator Component
 * 
 * Displays "X is typing..." indicator with animated dots
 * Handles both direct and group chat scenarios
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import i18n from '../i18n';

interface TypingIndicatorProps {
  typingUsers: string[]; // Array of display names
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  typingUsers,
}) => {
  // Animated values for the three dots
  const dot1Opacity = useRef(new Animated.Value(0.3)).current;
  const dot2Opacity = useRef(new Animated.Value(0.3)).current;
  const dot3Opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Animate dots in sequence
    const animateDots = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(dot1Opacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot2Opacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot3Opacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.parallel([
            Animated.timing(dot1Opacity, {
              toValue: 0.3,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(dot2Opacity, {
              toValue: 0.3,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(dot3Opacity, {
              toValue: 0.3,
              duration: 400,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    };

    animateDots();
  }, [dot1Opacity, dot2Opacity, dot3Opacity]);

  // Don't render if no one is typing
  if (typingUsers.length === 0) {
    return null;
  }

  // Format typing text based on number of users
  const getTypingText = (): string => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0]} ${i18n.t('typing.isTyping')}`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0]} and ${typingUsers[1]} ${i18n.t('typing.areTyping')}`;
    } else if (typingUsers.length === 3) {
      return `${typingUsers[0]}, ${typingUsers[1]} and ${typingUsers[2]} ${i18n.t('typing.areTyping')}`;
    } else {
      // More than 3 users
      return `${typingUsers[0]}, ${typingUsers[1]} and ${typingUsers.length - 2} others ${i18n.t('typing.areTyping')}`;
    }
  };

  return (
    <View style={styles.container} testID="typing-indicator">
      <View style={styles.bubble}>
        <Text style={styles.text}>{getTypingText()}</Text>
        <View style={styles.dotsContainer}>
          <Animated.View style={[styles.dot, { opacity: dot1Opacity }]} />
          <Animated.View style={[styles.dot, { opacity: dot2Opacity }]} />
          <Animated.View style={[styles.dot, { opacity: dot3Opacity }]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 4,
    marginHorizontal: 12,
    justifyContent: 'flex-start',
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    maxWidth: '75%',
  },
  text: {
    fontSize: 14,
    color: '#65676B',
    fontStyle: 'italic',
    marginRight: 4,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#65676B',
  },
});

