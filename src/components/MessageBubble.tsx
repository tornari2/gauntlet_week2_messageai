/**
 * MessageBubble Component
 * 
 * Displays a single message with appropriate styling
 * for sent vs received messages and read receipts
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { Message } from '../types';
import { formatBubbleTime } from '../utils/dateHelpers';
import { Colors } from '../constants/Colors';
import { useTranslationStore } from '../stores/translationStore';
import { getLanguageName, getLanguageFlag } from '../services/languageService';

interface MessageBubbleProps {
  message: Message;
  isSent: boolean;
  onRetry?: () => void;
  participants?: string[]; // Chat participants for read receipt logic
  senderName?: string; // Display name for group chats
  onReadReceiptPress?: () => void; // Callback when read receipt is tapped (for group chats)
  isGroupChat?: boolean; // Whether this is a group chat message
  senderColor?: string; // Avatar color of the sender (for group chats)
  autoTranslateEnabled?: boolean; // Whether auto-translate is enabled for this chat
  onCulturalContext?: (messageId: string, text: string, language: string) => void;
  onSlangExplanation?: (messageId: string, text: string, language: string) => void;
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
  autoTranslateEnabled = false,
  onCulturalContext,
  onSlangExplanation,
}) => {
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showingTranslation, setShowingTranslation] = useState(false);
  const [displayText, setDisplayText] = useState(message.text);
  
  const translationStore = useTranslationStore();
  const { userLanguage, translateMessage } = translationStore;

  // Reset image states when message changes (e.g., when optimistic message is replaced with real one)
  useEffect(() => {
    setImageLoading(false);
    setImageError(false);
    setDisplayText(message.text);
    setShowingTranslation(false);
  }, [message.id, message.imageUrl, message.text]);
  
  // Auto-translate effect
  useEffect(() => {
    const shouldAutoTranslate = 
      autoTranslateEnabled && 
      message.detectedLanguage && 
      message.detectedLanguage !== userLanguage &&
      message.text &&
      !showingTranslation;
    
    if (shouldAutoTranslate) {
      console.log(`[AutoTranslate] Translating message ${message.id} from ${message.detectedLanguage} to ${userLanguage}`);
      handleTranslate();
    }
  }, [autoTranslateEnabled, message.id, message.detectedLanguage, userLanguage]);

  const handleTranslate = async () => {
    if (!message.id || !message.detectedLanguage) return;

    try {
      const translated = await translateMessage(
        message.id,
        message.text,
        userLanguage,
        message.detectedLanguage
      );
      setDisplayText(translated);
      setShowingTranslation(true);
    } catch (error) {
      console.error('Translation error:', error);
      Alert.alert('Translation Error', 'Failed to translate message. Please try again.');
    }
  };

  const handleShowOriginal = () => {
    setDisplayText(message.text);
    setShowingTranslation(false);
  };

  const handleBubbleTap = () => {
    // Toggle translation on tap
    if (!message.text || message.text.trim().length === 0) return;
    
    // If showing translation, show original
    if (showingTranslation) {
      handleShowOriginal();
    } else {
      // If not showing translation, translate it
      if (message.detectedLanguage && message.detectedLanguage !== userLanguage) {
        handleTranslate();
      }
    }
  };

  const handleLongPress = () => {
    if (!message.text || message.text.trim().length === 0) return;

    const detectedLanguage = message.detectedLanguage || userLanguage;
    const languageName = getLanguageName(detectedLanguage);
    const languageFlag = getLanguageFlag(detectedLanguage);
    const options = ['Cancel'];
    
    // Cultural context option
    options.unshift('🧠 Explain Cultural Context');
    
    // Slang explanation option
    options.unshift('💬 Explain Slang');

    // Create the subtitle showing the language information
    let subtitle = '';
    if (showingTranslation && detectedLanguage && detectedLanguage !== userLanguage) {
      // If currently showing translation, show the flag and "Translated from..."
      subtitle = `${languageFlag} Translated from ${languageName}`;
    } else if (detectedLanguage && detectedLanguage !== userLanguage) {
      // If not translated but message is in foreign language
      subtitle = `Originally in ${languageName}`;
    } else {
      // Message in user's language
      subtitle = `Message in ${languageName}`;
    }

    Alert.alert(
      'Message Options',
      subtitle,
      options.map((option) => {
        if (option === 'Cancel') {
          return { text: option, style: 'cancel' };
        } else if (option === '🧠 Explain Cultural Context') {
          return { 
            text: option, 
            onPress: () => onCulturalContext?.(message.id, message.text, detectedLanguage)
          };
        } else if (option === '💬 Explain Slang') {
          return { 
            text: option, 
            onPress: () => onSlangExplanation?.(message.id, message.text, detectedLanguage)
          };
        }
        return { text: option };
      }),
      { cancelable: true }
    );
  };

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
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handleBubbleTap}
        onLongPress={handleLongPress}
        delayLongPress={500}
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
                width: Math.min(message.imageWidth || 200, 200),
                height: Math.min(message.imageHeight || 200, 200),
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
                key={message.imageUrl} // Force re-render when URL changes
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
        {displayText && (
          <Text
            style={[
              styles.text,
              isSent ? styles.lightText : styles.darkText,
              message.imageUrl && styles.textWithImage, // Add spacing if there's an image
            ]}
          >
            {displayText}
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
      </TouchableOpacity>
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


