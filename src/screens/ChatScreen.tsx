/**
 * ChatScreen (Placeholder)
 * 
 * Individual chat conversation screen
 * Full implementation in PR #4
 * For now: displays header with participant name and placeholders
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { MainStackParamList } from '../navigation/AppNavigator';

type ChatScreenRouteProp = RouteProp<MainStackParamList, 'Chat'>;

export const ChatScreen: React.FC = () => {
  const route = useRoute<ChatScreenRouteProp>();
  const navigation = useNavigation();
  const { chatId, chatName } = route.params;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{chatName}</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Placeholder content */}
      <View style={styles.placeholderContainer}>
        <Text style={styles.placeholderIcon}>💬</Text>
        <Text style={styles.placeholderTitle}>Chat with {chatName}</Text>
        <Text style={styles.placeholderSubtitle}>
          Chat ID: {chatId}
        </Text>
        <Text style={styles.placeholderInfo}>
          Full messaging functionality coming in PR #4
        </Text>
      </View>

      {/* Placeholder message input */}
      <View style={styles.inputContainer}>
        <View style={styles.input}>
          <Text style={styles.inputPlaceholder}>Type a message...</Text>
        </View>
        <TouchableOpacity style={styles.sendButton} disabled>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50, // Account for status bar
    backgroundColor: '#25D366',
    borderBottomWidth: 1,
    borderBottomColor: '#1EA952',
  },
  backButton: {
    paddingRight: 16,
  },
  backText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  headerRight: {
    width: 60, // Balance the back button
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  placeholderIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  placeholderTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  placeholderSubtitle: {
    fontSize: 14,
    color: '#8e8e93',
    marginBottom: 16,
    textAlign: 'center',
  },
  placeholderInfo: {
    fontSize: 16,
    color: '#25D366',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f2f5',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    justifyContent: 'center',
  },
  inputPlaceholder: {
    color: '#8e8e93',
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#25D366',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

