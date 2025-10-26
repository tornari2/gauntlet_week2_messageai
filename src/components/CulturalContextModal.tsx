/**
 * CulturalContextModal Component
 * Displays cultural context and insights for a message
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { CulturalContext } from '../types/translation';
import i18n from '../i18n';

interface CulturalContextModalProps {
  visible: boolean;
  context: CulturalContext | null;
  loading: boolean;
  error: Error | null;
  onClose: () => void;
  onRetry?: () => void;
}

export const CulturalContextModal: React.FC<CulturalContextModalProps> = ({
  visible,
  context,
  loading,
  error,
  onClose,
  onRetry,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>🧠 {i18n.t('culturalContext.title')}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1976D2" />
                <Text style={styles.loadingText}>{i18n.t('culturalContext.loading')}</Text>
              </View>
            )}

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{i18n.t('culturalContext.error')}</Text>
                <Text style={styles.errorSubtext}>{error.message}</Text>
                {onRetry && (
                  <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
                    <Text style={styles.retryButtonText}>{i18n.t('common.retry')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {context && !loading && !error && (
              <>
                {/* Original Message */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Message:</Text>
                  <Text style={styles.messageText}>{context.messageText}</Text>
                  <Text style={styles.languageTag}>
                    Language: {context.detectedLanguage.toUpperCase()}
                  </Text>
                </View>

                {/* Cultural Insights */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Cultural Insights:</Text>
                  <View style={styles.insightsContainer}>
                    <Text style={styles.insightsText}>{context.culturalInsights}</Text>
                  </View>
                </View>

                {/* References */}
                {context.references && context.references.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>References:</Text>
                    {context.references.map((ref, index) => (
                      <View key={index} style={styles.referenceItem}>
                        <Text style={styles.referenceBullet}>•</Text>
                        <Text style={styles.referenceText}>{ref}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.closeFooterButton} onPress={onClose}>
              <Text style={styles.closeFooterButtonText}>Close</Text>
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
  loadingContainer: {
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D32F2F',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#1976D2',
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
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
  messageText: {
    fontSize: 16,
    color: '#000',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  languageTag: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '600',
  },
  insightsContainer: {
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  insightsText: {
    fontSize: 16,
    color: '#000',
    lineHeight: 24,
  },
  referenceItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  referenceBullet: {
    fontSize: 16,
    color: '#1976D2',
    marginRight: 8,
    fontWeight: 'bold',
  },
  referenceText: {
    flex: 1,
    fontSize: 14,
    color: '#000',
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  closeFooterButton: {
    backgroundColor: '#1976D2',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeFooterButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

