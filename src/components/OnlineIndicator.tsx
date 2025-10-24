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
  isUnknown?: boolean; // Whether status is unknown (user is offline)
}

export const OnlineIndicator: React.FC<OnlineIndicatorProps> = React.memo(({
  isOnline,
  lastSeen,
  showText = false,
  size = 'medium',
  isUnknown = false,
}) => {
  const dotSize = size === 'small' ? 8 : size === 'medium' ? 10 : 12;

  // Determine dot color based on status
  const getDotColor = () => {
    if (isUnknown) return Colors.unknown;
    return isOnline ? Colors.online : Colors.offline;
  };

  // Determine status text
  const getStatusText = () => {
    if (isUnknown) return 'Status unknown (you are offline)';
    if (lastSeen) return formatLastSeen(lastSeen, isOnline);
    return isOnline ? 'Online' : 'Offline';
  };

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
              backgroundColor: getDotColor(),
            },
          ]}
        />
        <Text style={[styles.text, isOnline && !isUnknown ? styles.onlineText : styles.offlineText]}>
          {getStatusText()}
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
          backgroundColor: getDotColor(),
        },
      ]}
      testID={isUnknown ? 'unknown-dot' : (isOnline ? 'online-dot' : 'offline-dot')}
    />
  );
}, (prevProps, nextProps) => {
  // Only re-render if isOnline, lastSeen, or isUnknown actually changed
  return (
    prevProps.isOnline === nextProps.isOnline &&
    prevProps.lastSeen === nextProps.lastSeen &&
    prevProps.showText === nextProps.showText &&
    prevProps.size === nextProps.size &&
    prevProps.isUnknown === nextProps.isUnknown
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

