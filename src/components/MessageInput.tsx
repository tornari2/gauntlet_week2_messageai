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
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FormalitySelector } from './FormalitySelector';
import { useTranslationStore } from '../stores/translationStore';
import { FormalityLevel } from '../types/translation';
import i18n from '../i18n';

interface MessageInputProps {
  onSend: (text: string) => void;
  onImagePick?: () => void;
  onTypingChange?: (isTyping: boolean) => void;
  disabled?: boolean;
  chatId: string; // Added for auto-translate toggle
}

export const MessageInput: React.FC<MessageInputProps> = ({ 
  onSend, 
  onImagePick,
  onTypingChange,
  disabled = false,
  chatId
}) => {
  const [text, setText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showFormalitySelector, setShowFormalitySelector] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const translationStore = useTranslationStore();
  const { userLanguage, adjustFormality } = translationStore;
  const isAutoTranslateEnabled = translationStore.isAutoTranslateEnabled(chatId);

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

  const handleFormalityPress = async () => {
    if (!text.trim()) return;
    
    // Detect language of the text first
    try {
      const detectedLang = await translationStore.detectLanguage('temp', text);
      
      // Check if language is unknown/undefined
      const isUnknownLanguage = !detectedLang || detectedLang === 'und' || detectedLang === 'unknown' || detectedLang === 'xx';
      
      if (isUnknownLanguage) {
        Alert.alert(
          i18n.t('errors.languageUnknown'),
          i18n.t('errors.languageUnknownMessage')
        );
        return;
      }
      
      setShowFormalitySelector(true);
    } catch (error) {
      console.error('Error detecting language:', error);
      // If detection fails, still allow them to try
      setShowFormalitySelector(true);
    }
  };

  const handleFormalityPreview = async (originalText: string, level: FormalityLevel): Promise<string> => {
    return await adjustFormality(originalText, level, userLanguage);
  };

  const handleFormalityApply = (adjustedText: string) => {
    // Update the text in the input instead of sending immediately
    setText(adjustedText);
    setShowFormalitySelector(false);
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

        {/* Auto-translate toggle button */}
        <TouchableOpacity
          style={[
            styles.autoTranslateButton,
            isAutoTranslateEnabled && styles.autoTranslateButtonActive
          ]}
          onPress={() => {
            const currentSetting = translationStore.isAutoTranslateEnabled(chatId);
            translationStore.setAutoTranslate(chatId, !currentSetting);
          }}
          disabled={disabled}
          testID="auto-translate-button"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name={isAutoTranslateEnabled ? "language" : "language-outline"}
            size={20}
            color={isAutoTranslateEnabled ? '#FFFFFF' : (disabled ? '#C7C7CC' : '#007AFF')}
          />
        </TouchableOpacity>

        <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={handleTextChange}
          placeholder={i18n.t('chat.typing')}
          placeholderTextColor="#8E8E93"
          multiline
          maxLength={1000}
          editable={!disabled}
          testID="message-input"
        />
          {/* Formality indicator - appears when text is present */}
          {text.trim() && (
            <TouchableOpacity
              style={styles.formalityIndicator}
              onPress={handleFormalityPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name="sparkles-outline"
                size={18}
                color="#007AFF"
              />
            </TouchableOpacity>
          )}
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

      {/* Formality Selector Modal */}
      <FormalitySelector
        visible={showFormalitySelector}
        originalText={text}
        targetLanguage={userLanguage}
        onClose={() => setShowFormalitySelector(false)}
        onApply={handleFormalityApply}
        onPreview={handleFormalityPreview}
      />
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
  autoTranslateButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.2)',
  },
  autoTranslateButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  imageButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
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
    flex: 1,
    fontSize: 16,
    lineHeight: 20,
    color: '#000000',
    minHeight: 20,
  },
  formalityIndicator: {
    marginLeft: 8,
    padding: 4,
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


