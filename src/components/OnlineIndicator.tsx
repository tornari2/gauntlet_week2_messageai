/**
 * OnlineIndicator Component
 * Shows user's online/offline status with last seen time
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Timestamp } from 'firebase/firestore';
import { formatLastSeen } from '../utils/dateHelpers';
import { Colors } from '../constants/Colors';

interface OnlineIndicatorProps {
  isOnline: boolean;
  lastSeen?: Timestamp | Date;
  showText?: boolean; // Whether to show "Online" or "Last seen X ago" text
  size?: 'small' | 'medium' | 'large';
}

export const OnlineIndicator: React.FC<OnlineIndicatorProps> = React.memo(({
  isOnline,
  lastSeen,
  showText = false,
  size = 'medium',
}) => {
  const dotSize = size === 'small' ? 8 : size === 'medium' ? 10 : 12;

  if (showText) {
    return (
      <View style={styles.container}>
        <View
          style={[
            styles.dot,
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
            },
            isOnline ? styles.onlineDot : styles.offlineDot,
          ]}
        />
        <Text style={[styles.text, isOnline ? styles.onlineText : styles.offlineText]}>
          {lastSeen ? formatLastSeen(lastSeen, isOnline) : (isOnline ? 'Online' : 'Offline')}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.dot,
        {
          width: dotSize,
          height: dotSize,
          borderRadius: dotSize / 2,
        },
        isOnline ? styles.onlineDot : styles.offlineDot,
      ]}
      testID={isOnline ? 'online-dot' : 'offline-dot'}
    />
  );
}, (prevProps, nextProps) => {
  // Only re-render if isOnline or lastSeen actually changed
  return (
    prevProps.isOnline === nextProps.isOnline &&
    prevProps.lastSeen === nextProps.lastSeen &&
    prevProps.showText === nextProps.showText &&
    prevProps.size === nextProps.size
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  onlineDot: {
    backgroundColor: Colors.online,
  },
  offlineDot: {
    backgroundColor: Colors.offline,
  },
  text: {
    fontSize: 12,
    marginLeft: 6,
  },
  onlineText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  offlineText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '400',
  },
});

