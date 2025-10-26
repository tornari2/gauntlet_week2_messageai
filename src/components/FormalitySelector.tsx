/**
 * FormalitySelector Component  
 * Allows users to adjust message formality before sending
 */

import React, { useState, useEffect } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { FormalityLevel } from '../types/translation';
import i18n from '../i18n';

interface FormalitySelectorProps {
  originalText: string;
  visible: boolean;
  onClose: () => void;
  onApply: (adjustedText: string) => void; // Changed from onSend
  onPreview: (text: string, level: FormalityLevel) => Promise<string>;
  targetLanguage: string;
}

export const FormalitySelector: React.FC<FormalitySelectorProps> = ({
  originalText,
  visible,
  onClose,
  onApply, // Changed from onSend
  onPreview,
  targetLanguage,
}) => {
  const [selectedLevel, setSelectedLevel] = useState<FormalityLevel | null>(null);
  const [previewTexts, setPreviewTexts] = useState<Record<FormalityLevel, string>>({
    casual: '',
    neutral: '',
    formal: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formalityOptions: { level: FormalityLevel; label: string; description: string }[] = [
    {
      level: 'casual',
      label: i18n.t('formality.casual'),
      description: i18n.t('formality.casualDesc'),
    },
    {
      level: 'neutral',
      label: i18n.t('formality.neutral'),
      description: i18n.t('formality.neutralDesc'),
    },
    {
      level: 'formal',
      label: i18n.t('formality.formal'),
      description: i18n.t('formality.formalDesc'),
    },
  ];

  // Load all three formality versions when modal opens
  useEffect(() => {
    if (visible && originalText.trim()) {
      loadAllPreviews();
    }
  }, [visible, originalText]);

  const loadAllPreviews = async () => {
    setLoading(true);
    setError(null);
    setPreviewTexts({ casual: '', neutral: '', formal: '' });

    try {
      // Load all three formality levels in parallel
      const [casual, neutral, formal] = await Promise.all([
        onPreview(originalText, 'casual'),
        onPreview(originalText, 'neutral'),
        onPreview(originalText, 'formal'),
      ]);

      setPreviewTexts({
        casual,
        neutral,
        formal,
      });
    } catch (err) {
      console.error('Error loading formality previews:', err);
      setError(i18n.t('formality.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (selectedLevel && previewTexts[selectedLevel]) {
      onApply(previewTexts[selectedLevel]);
    } else {
      onApply(originalText);
    }
    handleClose();
  };

  const handleClose = () => {
    setPreviewTexts({ casual: '', neutral: '', formal: '' });
    setSelectedLevel(null);
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
            <Text style={styles.title}>{i18n.t('formality.title')}</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* Original Text */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{i18n.t('formality.original')}</Text>
              <Text style={styles.originalText}>{originalText}</Text>
            </View>

            {/* Loading State */}
            {loading && (
              <View style={styles.section}>
                <ActivityIndicator size="large" color="#1976D2" />
                <Text style={styles.loadingText}>{i18n.t('formality.loading')}</Text>
              </View>
            )}

            {/* Error State */}
            {error && (
              <View style={styles.section}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Formality Options with Previews */}
            {!loading && !error && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Select Version:</Text>
                {formalityOptions.map((option) => (
                  <TouchableOpacity
                    key={option.level}
                    style={[
                      styles.optionCard,
                      selectedLevel === option.level && styles.optionCardSelected,
                    ]}
                    onPress={() => setSelectedLevel(option.level)}
                  >
                    <View style={styles.optionHeader}>
                      <Text style={[
                        styles.optionLabel,
                        selectedLevel === option.level && styles.optionLabelSelected,
                      ]}>
                        {option.label}
                      </Text>
                      {selectedLevel === option.level && (
                        <Ionicons name="checkmark-circle" size={20} color="#1976D2" />
                      )}
                    </View>
                    <Text style={styles.optionDescription}>{option.description}</Text>
                    {previewTexts[option.level] && (
                      <View style={styles.previewContainer}>
                        <Text style={styles.previewText}>{previewTexts[option.level]}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
            >
              <Text style={styles.cancelButtonText}>{i18n.t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.applyButton,
                !selectedLevel && styles.applyButtonDisabled,
              ]}
              onPress={handleApply}
              disabled={!selectedLevel}
            >
              <Text style={styles.applyButtonText}>
                {selectedLevel ? i18n.t('formality.applyChanges') : i18n.t('formality.selectVersion')}
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
  optionCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  optionCardSelected: {
    borderColor: '#1976D2',
    backgroundColor: '#E3F2FD',
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  optionLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  optionLabelSelected: {
    color: '#1976D2',
  },
  optionDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
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
    backgroundColor: '#F9F9F9',
    padding: 12,
    borderRadius: 8,
    marginTop: 4,
  },
  previewText: {
    fontSize: 15,
    color: '#000',
    lineHeight: 20,
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
  applyButton: {
    backgroundColor: '#25D366',
  },
  applyButtonDisabled: {
    backgroundColor: '#BDBDBD',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

