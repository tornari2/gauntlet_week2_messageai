/**
 * Thread Summary Modal Component
 * Displays AI-generated summary of chat conversations
 */

import React from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThreadSummary } from '../types/ai';

interface ThreadSummaryModalProps {
  visible: boolean;
  summary: ThreadSummary | null;
  loading: boolean;
  error: Error | null;
  onClose: () => void;
  onRetry?: () => void;
}

export function ThreadSummaryModal({
  visible,
  summary,
  loading,
  error,
  onClose,
  onRetry,
}: ThreadSummaryModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="document-text" size={24} color="#007AFF" />
            <Text style={styles.headerTitle}>Thread Summary</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#007AFF" />
          </TouchableOpacity>
        </View>
        
        {/* Loading */}
        {loading && (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>
              AI is analyzing the conversation...
            </Text>
            <Text style={styles.loadingSubtext}>
              This may take a few seconds
            </Text>
          </View>
        )}
        
        {/* Error */}
        {error && !loading && (
          <View style={styles.centerContainer}>
            <Ionicons name="alert-circle" size={64} color="#FF3B30" />
            <Text style={styles.errorText}>Failed to generate summary</Text>
            <Text style={styles.errorSubtext}>
              {error.message || 'Something went wrong'}
            </Text>
            {onRetry && (
              <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        
        {/* Summary */}
        {summary && !loading && !error && (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Overview */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="clipboard" size={20} color="#007AFF" />
                <Text style={styles.sectionTitle}>Overview</Text>
              </View>
              <Text style={styles.summaryText}>{summary.summary}</Text>
              <Text style={styles.metaText}>
                Based on {summary.messageCount} messages
              </Text>
            </View>
            
            {/* Main Topics */}
            {summary.mainTopics.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="list" size={20} color="#FF9500" />
                  <Text style={styles.sectionTitle}>Main Topics</Text>
                </View>
                {summary.mainTopics.map((topic, index) => (
                  <View key={index} style={styles.bulletItem}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.bulletText}>{topic}</Text>
                  </View>
                ))}
              </View>
            )}
            
            {/* Key Points */}
            {summary.keyPoints.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="star" size={20} color="#FFD700" />
                  <Text style={styles.sectionTitle}>Key Points</Text>
                </View>
                {summary.keyPoints.map((point, index) => (
                  <View key={index} style={styles.bulletItem}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.bulletText}>{point}</Text>
                  </View>
                ))}
              </View>
            )}
            
            {/* Participant Contributions */}
            {summary.participantContributions.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="people" size={20} color="#34C759" />
                  <Text style={styles.sectionTitle}>Participant Contributions</Text>
                </View>
                {summary.participantContributions.map((contrib, index) => (
                  <View key={index} style={styles.contributionItem}>
                    <Text style={styles.contributionName}>
                      {contrib.userName}
                    </Text>
                    {contrib.mainPoints.map((point, pointIndex) => (
                      <View key={pointIndex} style={styles.subBulletItem}>
                        <Text style={styles.subBullet}>›</Text>
                        <Text style={styles.subBulletText}>{point}</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            )}
            
            {/* Timestamp */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Generated {new Date(summary.generatedAt).toLocaleString()}
              </Text>
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF3B30',
  },
  errorSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 32,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#333',
  },
  summaryText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 8,
  },
  metaText: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bullet: {
    fontSize: 18,
    lineHeight: 24,
    marginRight: 8,
    color: '#007AFF',
  },
  bulletText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
  },
  contributionItem: {
    marginBottom: 16,
    paddingLeft: 8,
  },
  contributionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  subBulletItem: {
    flexDirection: 'row',
    marginBottom: 4,
    paddingLeft: 8,
  },
  subBullet: {
    fontSize: 16,
    lineHeight: 20,
    marginRight: 8,
    color: '#34C759',
  },
  subBulletText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#555',
  },
  footer: {
    paddingTop: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
});

