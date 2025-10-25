/**
 * Translation Test Component
 * Add this button to your ChatScreen or any screen to test translation features
 * 
 * Usage:
 * 1. Import: import { TranslationTestButton } from '../components/TranslationTestButton';
 * 2. Add to render: <TranslationTestButton />
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Modal, Platform } from 'react-native';
import * as translationService from '../services/translationService';

export const TranslationTestButton: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);
  const [testing, setTesting] = useState(false);

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, result]);
  };

  const runTests = async () => {
    setTesting(true);
    setTestResults([]);
    
    try {
      addResult('🧪 Starting translation tests...\n');

      // Test 1: Language Detection
      addResult('1️⃣ Testing Language Detection...');
      try {
        const detected = await translationService.detectLanguage('Hello, how are you?');
        addResult(`✅ Detected: ${detected}\n`);
      } catch (error: any) {
        addResult(`❌ Failed: ${error.message}\n`);
      }

      // Test 2: Translation
      addResult('2️⃣ Testing Translation (FR→EN)...');
      try {
        const translated = await translationService.translateText(
          'Bonjour, comment allez-vous?',
          'en',
          'fr'
        );
        addResult(`✅ Translated: "${translated.translatedText}"\n`);
      } catch (error: any) {
        addResult(`❌ Failed: ${error.message}\n`);
      }

      // Test 3: Slang Explanation
      addResult('3️⃣ Testing Slang Explanation...');
      try {
        const explanations = await translationService.explainSlang(
          "That's sick! Let's bounce.",
          'en'
        );
        addResult(`✅ Found ${explanations.length} slang terms\n`);
      } catch (error: any) {
        addResult(`❌ Failed: ${error.message}\n`);
      }

      addResult('✅ All tests completed!');
    } catch (error: any) {
      addResult(`❌ Test suite failed: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={styles.testButton}
        onPress={() => setShowModal(true)}
      >
        <Text style={styles.testButtonText}>🧪 Test Translation</Text>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Translation Tests</Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={styles.closeButton}>Close</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.resultsContainer}>
            {testResults.length === 0 ? (
              <Text style={styles.emptyText}>
                Press "Run Tests" to test translation features
              </Text>
            ) : (
              testResults.map((result, index) => (
                <Text key={index} style={styles.resultText}>
                  {result}
                </Text>
              ))
            )}
          </ScrollView>

          <TouchableOpacity
            style={[styles.runButton, testing && styles.runButtonDisabled]}
            onPress={runTests}
            disabled={testing}
          >
            <Text style={styles.runButtonText}>
              {testing ? '⏳ Testing...' : '▶️ Run Tests'}
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  testButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    margin: 8,
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  modal: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    fontSize: 16,
    color: '#2196F3',
  },
  resultsContainer: {
    flex: 1,
    padding: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#8E8E93',
    marginTop: 32,
  },
  resultText: {
    fontSize: 14,
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  runButton: {
    backgroundColor: '#4CAF50',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  runButtonDisabled: {
    backgroundColor: '#BDBDBD',
  },
  runButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

