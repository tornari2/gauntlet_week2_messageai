/**
 * MultilingualSummaryModal Component
 * Displays multilingual thread summary in user's preferred language
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
import { MultilingualSummary } from '../types/translation';
import i18n from '../i18n';

interface MultilingualSummaryModalProps {
  visible: boolean;
  summary: MultilingualSummary | null;
  loading: boolean;
  error: Error | null;
  onClose: () => void;
  onRetry?: () => void;
  onShareToChat?: (text: string) => void;
}

export const MultilingualSummaryModal: React.FC<MultilingualSummaryModalProps> = ({
  visible,
  summary,
  loading,
  error,
  onClose,
  onRetry,
  onShareToChat,
}) => {
  const handleShareToChat = () => {
    if (!summary) return;

    let shareText = `📝 Thread Summary:\n\n${summary.overview}\n\n`;
    
    if (summary.participantSummaries && summary.participantSummaries.length > 0) {
      shareText += 'Key Points:\n';
      summary.participantSummaries.forEach((ps) => {
        shareText += `\n• ${ps.participantName}:\n`;
        ps.keyPoints.forEach((point) => {
          shareText += `  - ${point}\n`;
        });
      });
    }

    if (onShareToChat) {
      onShareToChat(shareText);
      onClose();
    }
  };

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
            <Text style={styles.title}>📝 {i18n.t('summary.title')}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1976D2" />
                <Text style={styles.loadingText}>{i18n.t('summary.loading')}</Text>
              </View>
            )}

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{i18n.t('summary.error')}</Text>
                <Text style={styles.errorSubtext}>{error.message}</Text>
                {onRetry && (
                  <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
                    <Text style={styles.retryButtonText}>{i18n.t('common.retry')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {summary && !loading && !error && (
              <>
                {/* Languages detected */}
                {summary.languagesDetected && summary.languagesDetected.length > 0 && (
                  <View style={styles.languagesContainer}>
                    <Text style={styles.languagesLabel}>Languages detected:</Text>
                    <View style={styles.languagesRow}>
                      {summary.languagesDetected.map((lang, index) => (
                        <View key={index} style={styles.languageBadge}>
                          <Text style={styles.languageBadgeText}>{lang.toUpperCase()}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Overview */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Overview</Text>
                  <View style={styles.overviewContainer}>
                    <Text style={styles.overviewText}>{summary.overview}</Text>
                  </View>
                </View>

                {/* Participant Summaries */}
                {summary.participantSummaries && summary.participantSummaries.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Key Points by Participant</Text>
                    {summary.participantSummaries.map((ps, index) => (
                      <View key={index} style={styles.participantCard}>
                        <Text style={styles.participantName}>{ps.participantName}</Text>
                        {ps.keyPoints.map((point, pointIndex) => (
                          <View key={pointIndex} style={styles.keyPointRow}>
                            <Text style={styles.keyPointBullet}>•</Text>
                            <Text style={styles.keyPointText}>{point}</Text>
                          </View>
                        ))}
                      </View>
                    ))}
                  </View>
                )}

                {/* Generated in */}
                <View style={styles.metaContainer}>
                  <Text style={styles.metaText}>
                    Generated in {summary.generatedIn.toUpperCase()} • {new Date(summary.timestamp).toLocaleTimeString()}
                  </Text>
                </View>
              </>
            )}
          </ScrollView>

          <View style={styles.footer}>
            {summary && onShareToChat && (
              <TouchableOpacity style={styles.shareButton} onPress={handleShareToChat}>
                <Text style={styles.shareButtonText}>📤 {i18n.t('summary.share')}</Text>
              </TouchableOpacity>
            )}
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
    maxHeight: '85%',
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
  languagesContainer: {
    marginBottom: 16,
  },
  languagesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  languagesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  languageBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1976D2',
  },
  languageBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1976D2',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  overviewContainer: {
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  overviewText: {
    fontSize: 16,
    color: '#000',
    lineHeight: 24,
  },
  participantCard: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  participantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 8,
  },
  keyPointRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  keyPointBullet: {
    fontSize: 16,
    color: '#666',
    marginRight: 8,
    fontWeight: 'bold',
  },
  keyPointText: {
    flex: 1,
    fontSize: 14,
    color: '#000',
    lineHeight: 20,
  },
  metaContainer: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  metaText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 8,
  },
  shareButton: {
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  shareButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2E7D32',
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

