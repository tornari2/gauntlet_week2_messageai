/**
 * MessageInput Component
 * 
 * Text input with send button for composing and sending messages
 * Includes typing indicator support
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MessageInputProps {
  onSend: (text: string) => void;
  onImagePick?: () => void;
  onTypingChange?: (isTyping: boolean) => void;
  disabled?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({ 
  onSend, 
  onImagePick,
  onTypingChange,
  disabled = false 
}) => {
  const [text, setText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      // Clear all timers
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      // Stop typing when component unmounts
      if (onTypingChange) {
        onTypingChange(false);
      }
    };
    // Empty dependency array - only run on mount/unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopTyping = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }
    setIsTyping(false);
    if (onTypingChange) {
      onTypingChange(false);
    }
  };

  const startTyping = () => {
    setIsTyping(true);
    if (onTypingChange) {
      onTypingChange(true);
    }
    
    // Send heartbeat every 3 seconds to keep typing indicator alive
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }
    heartbeatIntervalRef.current = setInterval(() => {
      if (onTypingChange) {
        onTypingChange(true);
      }
    }, 3000); // Every 3 seconds
  };

  const handleTextChange = (newText: string) => {
    setText(newText);

    // Typing indicator logic
    if (onTypingChange) {
      // Start typing if there's text and we're not already typing
      if (newText.trim() && !isTyping) {
        startTyping();
      }

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set new timeout to stop typing after 5 seconds of inactivity
      if (newText.trim()) {
        typingTimeoutRef.current = setTimeout(() => {
          stopTyping();
        }, 5000); // 5 seconds - more forgiving
      } else {
        // No text, stop typing immediately
        stopTyping();
      }
    }
  };

  const handleSend = () => {
    const trimmedText = text.trim();
    
    if (trimmedText && !disabled) {
      // Stop typing indicator
      stopTyping();
      
      onSend(trimmedText);
      setText('');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.container}>
        {/* Image picker button */}
        <TouchableOpacity
          style={styles.imageButton}
          onPress={onImagePick}
          disabled={disabled}
          testID="image-picker-button"
        >
          <Ionicons
            name="image-outline"
            size={24}
            color={disabled ? '#C7C7CC' : '#007AFF'}
          />
        </TouchableOpacity>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={handleTextChange}
            placeholder="Type a message..."
            placeholderTextColor="#8E8E93"
            multiline
            maxLength={1000}
            editable={!disabled}
            testID="message-input"
          />
        </View>
        
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!text.trim() || disabled) && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!text.trim() || disabled}
          testID="send-button"
        >
          <Ionicons
            name="send"
            size={20}
            color={text.trim() && !disabled ? '#FFFFFF' : '#C7C7CC'}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F6F6F6',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  imageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  inputContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100,
  },
  input: {
    fontSize: 16,
    lineHeight: 20,
    color: '#000000',
    minHeight: 20,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#F0F0F0',
  },
});


