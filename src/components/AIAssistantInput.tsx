/**
 * AI Assistant Input Component
 * 
 * Replaces the summary button with a text input for natural language queries
 */

import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import i18n from '../i18n';

interface AIAssistantInputProps {
  onQuery: (query: string) => void;
  loading?: boolean;
}

export function AIAssistantInput({ onQuery, loading }: AIAssistantInputProps) {
  const [query, setQuery] = useState('');
  const [showExamples, setShowExamples] = useState(true);

  const handleSubmit = () => {
    if (query.trim() && !loading) {
      onQuery(query.trim());
      setShowExamples(false);
    }
  };

  const handleExamplePress = (example: string) => {
    setQuery(example);
    setShowExamples(false);
    onQuery(example);
  };

  // Get example queries from translations
  const examples = [
    i18n.t('aiAssistant.exampleSummarize'),
    i18n.t('aiAssistant.exampleTodo'),
    i18n.t('aiAssistant.exampleDates'),
    i18n.t('aiAssistant.exampleMood'),
  ];

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <Ionicons name="sparkles" size={20} color="#8B5CF6" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder={i18n.t('aiAssistant.placeholder')}
          placeholderTextColor="#9CA3AF"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSubmit}
          returnKeyType="search"
          editable={!loading}
        />
        {loading ? (
          <ActivityIndicator size="small" color="#8B5CF6" style={styles.button} />
        ) : (
          <TouchableOpacity
            style={[styles.button, !query.trim() && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={!query.trim()}
          >
            <Ionicons
              name="send"
              size={20}
              color={query.trim() ? '#8B5CF6' : '#D1D5DB'}
            />
          </TouchableOpacity>
        )}
      </View>

      {showExamples && !loading && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.examplesContainer}
          contentContainerStyle={styles.examplesContent}
        >
          {examples.map((example, index) => (
            <TouchableOpacity
              key={index}
              style={styles.exampleChip}
              onPress={() => handleExamplePress(example)}
            >
              <Text style={styles.exampleText}>{example}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    paddingVertical: 4,
  },
  button: {
    padding: 4,
    marginLeft: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  examplesContainer: {
    marginTop: 12,
  },
  examplesContent: {
    paddingRight: 16,
  },
  exampleChip: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  exampleText: {
    fontSize: 13,
    color: '#7C3AED',
    fontWeight: '500',
  },
});

