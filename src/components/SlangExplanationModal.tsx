/**
 * SlangExplanationModal Component
 * Displays slang and idiom explanations for a message
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
import { SlangExplanation } from '../types/translation';
import i18n from '../i18n';

interface SlangExplanationModalProps {
  visible: boolean;
  explanations: SlangExplanation[] | null;
  loading: boolean;
  error: Error | null;
  onClose: () => void;
  onRetry?: () => void;
}

export const SlangExplanationModal: React.FC<SlangExplanationModalProps> = ({
  visible,
  explanations,
  loading,
  error,
  onClose,
  onRetry,
}) => {
  const hasExplanations = explanations && explanations.length > 0;

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
            <Text style={styles.title}>💬 {i18n.t('slang.title')}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1976D2" />
                <Text style={styles.loadingText}>{i18n.t('slang.loading')}</Text>
              </View>
            )}

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{i18n.t('slang.error')}</Text>
                <Text style={styles.errorSubtext}>{error.message}</Text>
                {onRetry && (
                  <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
                    <Text style={styles.retryButtonText}>{i18n.t('common.retry')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {!loading && !error && !hasExplanations && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>✓</Text>
                <Text style={styles.emptyText}>{i18n.t('slang.noSlang')}</Text>
                <Text style={styles.emptySubtext}>{i18n.t('slang.standardLanguage')}</Text>
              </View>
            )}

            {hasExplanations && !loading && !error && (
              <View>
                <Text style={styles.introText}>
                  {explanations.length} {i18n.t('slang.found')}:
                </Text>
                {explanations.map((explanation, index) => (
                  <View key={index} style={styles.explanationCard}>
                    {/* Term */}
                    <View style={styles.termContainer}>
                      <Text style={styles.termText}>{explanation.term}</Text>
                    </View>

                    {/* Literal Meaning */}
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{i18n.t('slang.literal')}:</Text>
                      <Text style={styles.detailText}>{explanation.literal}</Text>
                    </View>

                    {/* Actual Meaning */}
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{i18n.t('slang.meaning')}:</Text>
                      <Text style={styles.detailText}>{explanation.meaning}</Text>
                    </View>

                    {/* Example */}
                    {explanation.example && (
                      <View style={styles.exampleContainer}>
                        <Text style={styles.exampleLabel}>{i18n.t('slang.example')}:</Text>
                        <Text style={styles.exampleText}>"{explanation.example}"</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.closeFooterButton} onPress={onClose}>
              <Text style={styles.closeFooterButtonText}>{i18n.t('common.close')}</Text>
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
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  introText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 16,
  },
  explanationCard: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#1976D2',
  },
  termContainer: {
    marginBottom: 12,
  },
  termText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  detailRow: {
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  detailText: {
    fontSize: 16,
    color: '#000',
    lineHeight: 22,
  },
  exampleContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  exampleLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  exampleText: {
    fontSize: 15,
    color: '#000',
    fontStyle: 'italic',
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

