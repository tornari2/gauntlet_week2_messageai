/**
 * MessageBubble Component
 * 
 * Displays a single message with appropriate styling
 * for sent vs received messages
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Message } from '../types';
import { formatBubbleTime } from '../utils/dateHelpers';

interface MessageBubbleProps {
  message: Message;
  isSent: boolean;
  onRetry?: () => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isSent, onRetry }) => {
  return (
    <View
      style={[
        styles.container,
        isSent ? styles.sentContainer : styles.receivedContainer,
      ]}
      testID="message-bubble"
    >
      <View
        style={[
          styles.bubble,
          isSent ? styles.sentBubble : styles.receivedBubble,
          message.pending && styles.pendingBubble,
          message.failed && styles.failedBubble,
        ]}
      >
        <Text
          style={[
            styles.text,
            isSent ? styles.sentText : styles.receivedText,
          ]}
        >
          {message.text}
        </Text>
        
        <View style={styles.metaContainer}>
          <Text
            style={[
              styles.time,
              isSent ? styles.sentTime : styles.receivedTime,
            ]}
          >
            {formatBubbleTime(message.timestamp)}
          </Text>
          
          {isSent && (
            <Text style={styles.statusIcon}>
              {message.pending ? '◷' : message.failed ? '!' : '✓'}
            </Text>
          )}
        </View>
        
        {message.failed && onRetry && (
          <TouchableOpacity
            style={styles.retryButton}
            onPress={onRetry}
            testID="retry-button"
          >
            <Text style={styles.retryText}>Tap to retry</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 4,
    marginHorizontal: 12,
  },
  sentContainer: {
    justifyContent: 'flex-end',
  },
  receivedContainer: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  sentBubble: {
    backgroundColor: '#25D366',
    borderBottomRightRadius: 4,
  },
  receivedBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  pendingBubble: {
    opacity: 0.7,
  },
  failedBubble: {
    backgroundColor: '#FFE5E5',
    borderColor: '#FF0000',
  },
  text: {
    fontSize: 16,
    lineHeight: 20,
  },
  sentText: {
    color: '#FFFFFF',
  },
  receivedText: {
    color: '#000000',
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    justifyContent: 'flex-end',
  },
  time: {
    fontSize: 11,
    marginRight: 4,
  },
  sentTime: {
    color: '#F0F0F0',
  },
  receivedTime: {
    color: '#8E8E93',
  },
  statusIcon: {
    fontSize: 12,
    color: '#F0F0F0',
  },
  retryButton: {
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    alignSelf: 'center',
  },
  retryText: {
    fontSize: 12,
    color: '#FF0000',
    fontWeight: '600',
  },
});

