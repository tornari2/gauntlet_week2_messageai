/**
 * Priority Badge Component
 * Displays priority indicator on messages
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MessagePriority } from '../types/ai';

interface PriorityBadgeProps {
  priority: MessagePriority;
  compact?: boolean;
}

export function PriorityBadge({ priority, compact = false }: PriorityBadgeProps) {
  // Don't show badge for low priority messages
  if (priority === 'low' || priority === 'medium') {
    return null;
  }
  
  const config = {
    urgent: {
      icon: 'warning',
      color: '#FF3B30',
      bg: '#FFEBEE',
      label: 'URGENT',
      emoji: '🔴',
    },
    high: {
      icon: 'alert-circle',
      color: '#FF9500',
      bg: '#FFF3E0',
      label: 'HIGH',
      emoji: '🟠',
    },
  };
  
  const style = config[priority as 'urgent' | 'high'];
  
  if (!style) {
    return null;
  }
  
  if (compact) {
    return (
      <View style={[styles.compactBadge, { backgroundColor: style.bg }]}>
        <Text style={styles.emoji}>{style.emoji}</Text>
      </View>
    );
  }
  
  return (
    <View style={[styles.badge, { backgroundColor: style.bg }]}>
      <Ionicons name={style.icon as any} size={14} color={style.color} />
      <Text style={[styles.label, { color: style.color }]}>
        {style.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  compactBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  emoji: {
    fontSize: 12,
  },
});

