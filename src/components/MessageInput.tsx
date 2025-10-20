/**
 * MessageInput Component
 * 
 * Text input with send button for composing and sending messages
 */

import React, { useState } from 'react';
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
  disabled?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({ onSend, disabled = false }) => {
  const [text, setText] = useState('');

  const handleSend = () => {
    const trimmedText = text.trim();
    
    if (trimmedText && !disabled) {
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
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
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

