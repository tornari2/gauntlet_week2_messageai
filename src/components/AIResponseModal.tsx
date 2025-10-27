/**
 * AI Response Modal Component
 * 
 * Displays AI assistant response with collapsible sections
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AIAssistantResponse } from '../types/assistant';
import { formatAssistantResponse } from '../services/aiAssistantService';
import i18n from '../i18n';

interface AIResponseModalProps {
  visible: boolean;
  response: AIAssistantResponse | null;
  onClose: () => void;
  onPasteInChat: (text: string) => void;
}

export function AIResponseModal({
  visible,
  response,
  onClose,
  onPasteInChat,
}: AIResponseModalProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    summary: true,
    actionItems: true,
    dates: true,
    tone: true,
  });

  const viewRef = useRef<View>(null);

  if (!response) return null;

  const { response: data, metadata } = response;

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handlePaste = () => {
    const formatted = formatAssistantResponse(response);
    onPasteInChat(formatted);
    onClose();
  };

  // Only show summary - hide individual sections
  const hasSummary = !!data.summary;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="sparkles" size={24} color="#8B5CF6" />
              <Text style={styles.headerTitle}>{i18n.t('aiAssistant.title')}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} ref={viewRef}>
            {/* Summary Section - Always expanded, no collapsing */}
            {hasSummary && (
              <View style={styles.section}>
                <Text style={styles.sectionContent}>{data.summary}</Text>
              </View>
            )}
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.footerButtonFull} onPress={handlePaste}>
              <Ionicons name="chatbubble-outline" size={20} color="#8B5CF6" />
              <Text style={styles.footerButtonText}>{i18n.t('aiAssistant.pasteInChat')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  metadataBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  metadataText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 6,
  },
  section: {
    marginBottom: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  sectionContent: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
    marginTop: 12,
  },
  listContainer: {
    marginTop: 12,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  listItemBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#8B5CF6',
    marginTop: 8,
    marginRight: 12,
  },
  listItemContent: {
    flex: 1,
  },
  listItemText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  listItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    flexWrap: 'wrap',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 8,
  },
  priorityHigh: {
    backgroundColor: '#FEE2E2',
  },
  priorityMedium: {
    backgroundColor: '#FEF3C7',
  },
  priorityLow: {
    backgroundColor: '#DBEAFE',
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#111827',
  },
  assigneeText: {
    fontSize: 13,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  dateItem: {
    marginBottom: 12,
  },
  dateItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
    marginRight: 8,
  },
  deadlineBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  deadlineText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#DC2626',
  },
  dateDescription: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  toneContainer: {},
  toneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  toneOverall: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
    marginRight: 12,
  },
  sentimentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sentimentPositive: {
    backgroundColor: '#D1FAE5',
  },
  sentimentNeutral: {
    backgroundColor: '#E5E7EB',
  },
  sentimentNegative: {
    backgroundColor: '#FEE2E2',
  },
  sentimentText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#111827',
  },
  toneDetails: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
    marginBottom: 8,
  },
  emotionsContainer: {
    marginTop: 8,
  },
  emotionsLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
  },
  emotionsChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emotionChip: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  emotionText: {
    fontSize: 13,
    color: '#7C3AED',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  footerButtonFull: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  footerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  footerButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8B5CF6',
    marginLeft: 8,
  },
  footerDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
});

