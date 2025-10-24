/**
 * MessageBubble Component
 * 
 * Displays a single message with appropriate styling
 * for sent vs received messages and read receipts
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Message } from '../types';
import { formatBubbleTime } from '../utils/dateHelpers';
import { Colors } from '../constants/Colors';

interface MessageBubbleProps {
  message: Message;
  isSent: boolean;
  onRetry?: () => void;
  participants?: string[]; // Chat participants for read receipt logic
  senderName?: string; // Display name for group chats
  onReadReceiptPress?: () => void; // Callback when read receipt is tapped (for group chats)
  isGroupChat?: boolean; // Whether this is a group chat message
  senderColor?: string; // Avatar color of the sender (for group chats)
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  message, 
  isSent, 
  onRetry,
  participants = [],
  senderName,
  onReadReceiptPress,
  isGroupChat = false,
  senderColor,
}) => {
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Reset image states when message changes (e.g., when optimistic message is replaced with real one)
  useEffect(() => {
    setImageLoading(false);
    setImageError(false);
  }, [message.id, message.imageUrl]);

  // Get bubble background color
  const getBubbleColor = () => {
    if (isSent) {
      return Colors.primaryDark; // Dark brown for sent messages
    }
    return Colors.receivedBubble; // White for all received messages (direct or group)
  };
  // Determine read receipt status
  const getReadReceiptIcon = () => {
    if (message.pending) {
      return '◷'; // Clock - pending
    }
    
    if (message.failed) {
      return '!'; // Exclamation - failed
    }
    
    // For sent messages, check read status
    const readByCount = message.readBy?.length || 0;
    
    // Remove sender from participants to get other participants
    const otherParticipants = participants.filter(p => p !== message.senderId);
    const allOthersRead = otherParticipants.every(p => message.readBy?.includes(p));
    
    if (readByCount === 1) {
      // Only sender has read (just sent)
      return '✓'; // Single check - sent
    } else if (allOthersRead && otherParticipants.length > 0) {
      // All other participants have read
      return '✓✓'; // Double check - read (will be blue)
    } else if (readByCount > 1) {
      // Some have read but not all
      return '✓✓'; // Double check - delivered
    }
    
    return '✓'; // Default to single check
  };
  
  const getReadReceiptColor = () => {
    if (message.pending || message.failed) {
      return '#F0F0F0';
    }
    
    // Blue checks if all participants have read
    const otherParticipants = participants.filter(p => p !== message.senderId);
    const allOthersRead = otherParticipants.every(p => message.readBy?.includes(p));
    
    if (allOthersRead && otherParticipants.length > 0) {
      return '#4FC3F7'; // Blue for read
    }
    
    return '#F0F0F0'; // White for sent/delivered
  };

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
          { backgroundColor: getBubbleColor() },
          isSent && styles.sentBubbleShape,
          !isSent && styles.receivedBubbleShape,
          !isSent && styles.receivedBubbleBorder, // Add border for all received messages
          message.pending && styles.pendingBubble,
          message.failed && styles.failedBubble,
        ]}
      >
        {/* Show sender name for group chats on received messages */}
        {!isSent && senderName && (
          <Text style={[
            styles.senderName,
            senderColor && { color: senderColor } // Use sender's avatar color for name
          ]}>
            {senderName}
          </Text>
        )}
        
        {/* Show image if present */}
        {message.imageUrl && (
          <View 
            style={[
              styles.imageContainer,
              {
                width: message.imageWidth || 250,
                height: message.imageHeight || 250,
              }
            ]}
          >
            {imageLoading && !imageError && (
              <View style={styles.imagePlaceholder}>
                <ActivityIndicator size="large" color={isSent ? '#FFFFFF' : Colors.primary} />
              </View>
            )}
            
            {!imageError && (
              <Image
                source={{ uri: message.imageUrl }}
                style={styles.image}
                resizeMode="cover"
                onLoadStart={() => setImageLoading(true)}
                onLoadEnd={() => setImageLoading(false)}
                onError={() => {
                  setImageLoading(false);
                  setImageError(true);
                }}
              />
            )}
            
            {imageError && (
              <View style={styles.imageErrorContainer}>
                <Text style={styles.imageErrorText}>Failed to load image</Text>
              </View>
            )}
          </View>
        )}
        
        {/* Show text if present */}
        {message.text && (
          <Text
            style={[
              styles.text,
              isSent ? styles.lightText : styles.darkText,
              message.imageUrl && styles.textWithImage, // Add spacing if there's an image
            ]}
          >
            {message.text}
          </Text>
        )}
        
        <View style={styles.metaContainer}>
          <Text
            style={[
              styles.time,
              isSent ? styles.lightTime : styles.darkTime,
            ]}
          >
            {formatBubbleTime(message.timestamp)}
          </Text>
          
          {isSent && (
            <TouchableOpacity
              onPress={isGroupChat && onReadReceiptPress ? onReadReceiptPress : undefined}
              disabled={!isGroupChat || !onReadReceiptPress}
              activeOpacity={isGroupChat && onReadReceiptPress ? 0.6 : 1}
              testID={isGroupChat ? "read-receipt-touchable" : undefined}
            >
              <Text 
                style={[
                  styles.statusIcon, 
                  { color: getReadReceiptColor() }
                ]}
                testID="read-receipt"
              >
                {getReadReceiptIcon()}
              </Text>
            </TouchableOpacity>
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
  sentBubbleShape: {
    borderBottomRightRadius: 4,
  },
  receivedBubbleShape: {
    borderBottomLeftRadius: 4,
  },
  receivedBubbleBorder: {
    borderWidth: 1,
    borderColor: Colors.border,
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
  lightText: {
    color: '#FFFFFF',
  },
  darkText: {
    color: '#000000',
  },
  textWithImage: {
    marginTop: 8,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primaryDark, // Default color, overridden by inline style with user's color
    marginBottom: 4,
  },
  imageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 4,
    position: 'relative',
  },
  imagePlaceholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    zIndex: 1,
  },
  image: {
    borderRadius: 12,
    width: '100%',
    height: '100%',
  },
  imageError: {
    opacity: 0.3,
  },
  imageErrorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
  },
  imageErrorText: {
    color: '#FFFFFF',
    fontSize: 12,
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
  lightTime: {
    color: '#F0F0F0',
  },
  darkTime: {
    color: '#8E8E93',
  },
  statusIcon: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textLight,
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


