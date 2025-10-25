/**
 * FormalitySelector Component  
 * Allows users to adjust message formality before sending
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { FormalityLevel } from '../types/translation';

interface FormalitySelectorProps {
  originalText: string;
  visible: boolean;
  onClose: () => void;
  onSend: (adjustedText: string) => void;
  onPreview: (text: string, level: FormalityLevel) => Promise<string>;
  targetLanguage: string;
}

export const FormalitySelector: React.FC<FormalitySelectorProps> = ({
  originalText,
  visible,
  onClose,
  onSend,
  onPreview,
  targetLanguage,
}) => {
  const [selectedLevel, setSelectedLevel] = useState<FormalityLevel>('neutral');
  const [previewText, setPreviewText] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formalityOptions: { level: FormalityLevel; icon: string; label: string; description: string }[] = [
    {
      level: 'casual',
      icon: '🙂',
      label: 'Casual',
      description: 'Friendly, relaxed, conversational',
    },
    {
      level: 'neutral',
      icon: '😐',
      label: 'Neutral',
      description: 'Professional but approachable',
    },
    {
      level: 'formal',
      icon: '🎩',
      label: 'Formal',
      description: 'Respectful, polite, business-appropriate',
    },
  ];

  const handlePreview = async (level: FormalityLevel) => {
    setSelectedLevel(level);
    setLoading(true);
    setError(null);
    setPreviewText('');

    try {
      const adjusted = await onPreview(originalText, level);
      setPreviewText(adjusted);
    } catch (err) {
      console.error('Error previewing formality:', err);
      setError('Failed to adjust formality. Please try again.');
      setPreviewText('');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => {
    if (previewText) {
      onSend(previewText);
    } else {
      onSend(originalText);
    }
    handleClose();
  };

  const handleClose = () => {
    setPreviewText('');
    setSelectedLevel('neutral');
    setError(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Adjust Formality</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* Original Text */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Original Message:</Text>
              <Text style={styles.originalText}>{originalText}</Text>
            </View>

            {/* Formality Options */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select Formality Level:</Text>
              <View style={styles.optionsContainer}>
                {formalityOptions.map((option) => (
                  <TouchableOpacity
                    key={option.level}
                    style={[
                      styles.optionButton,
                      selectedLevel === option.level && styles.optionButtonSelected,
                    ]}
                    onPress={() => handlePreview(option.level)}
                    disabled={loading}
                  >
                    <Text style={styles.optionIcon}>{option.icon}</Text>
                    <Text style={[
                      styles.optionLabel,
                      selectedLevel === option.level && styles.optionLabelSelected,
                    ]}>
                      {option.label}
                    </Text>
                    <Text style={styles.optionDescription}>{option.description}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Preview */}
            {loading && (
              <View style={styles.section}>
                <ActivityIndicator size="large" color="#1976D2" />
                <Text style={styles.loadingText}>Adjusting formality...</Text>
              </View>
            )}

            {error && (
              <View style={styles.section}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {previewText && !loading && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Preview:</Text>
                <View style={styles.previewContainer}>
                  <Text style={styles.previewText}>{previewText}</Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.sendButton,
                (!previewText && !originalText) && styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={!previewText && !originalText}
            >
              <Text style={styles.sendButtonText}>
                {previewText ? 'Send Adjusted' : 'Send Original'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  originalText: {
    fontSize: 16,
    color: '#000',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  optionButtonSelected: {
    borderColor: '#1976D2',
    backgroundColor: '#E3F2FD',
  },
  optionIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  optionLabelSelected: {
    color: '#1976D2',
  },
  optionDescription: {
    fontSize: 12,
    color: '#666',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 12,
    color: '#666',
  },
  errorText: {
    color: '#D32F2F',
    textAlign: 'center',
  },
  previewContainer: {
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  previewText: {
    fontSize: 16,
    color: '#000',
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  sendButton: {
    backgroundColor: '#1976D2',
  },
  sendButtonDisabled: {
    backgroundColor: '#BDBDBD',
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

