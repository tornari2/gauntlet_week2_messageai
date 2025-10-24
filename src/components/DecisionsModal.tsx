/**
 * Decisions Modal Component
 * Displays AI-tracked decisions and agreements from conversations
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
import { Decision } from '../types/ai';

interface DecisionsModalProps {
  visible: boolean;
  decisions: Decision[];
  loading: boolean;
  error: Error | null;
  onClose: () => void;
  onRetry?: () => void;
}

export function DecisionsModal({
  visible,
  decisions,
  loading,
  error,
  onClose,
  onRetry,
}: DecisionsModalProps) {
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
            <Ionicons name="flag" size={24} color="#FF9500" />
            <Text style={styles.headerTitle}>Decisions Tracked</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#007AFF" />
          </TouchableOpacity>
        </View>
        
        {/* Count */}
        {!loading && !error && decisions.length > 0 && (
          <View style={styles.countContainer}>
            <Text style={styles.countText}>
              {decisions.length} decision{decisions.length !== 1 ? 's' : ''} found
            </Text>
          </View>
        )}
        
        {/* Loading */}
        {loading && (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>
              Tracking decisions...
            </Text>
            <Text style={styles.loadingSubtext}>
              AI is analyzing the conversation
            </Text>
          </View>
        )}
        
        {/* Error */}
        {error && !loading && (
          <View style={styles.centerContainer}>
            <Ionicons name="alert-circle" size={64} color="#FF3B30" />
            <Text style={styles.errorText}>Failed to track decisions</Text>
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
        
        {/* Decisions */}
        {!loading && !error && decisions.length > 0 && (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {decisions.map((decision, index) => (
              <DecisionCard key={decision.id} decision={decision} index={index} />
            ))}
          </ScrollView>
        )}
        
        {/* Empty State */}
        {!loading && !error && decisions.length === 0 && (
          <View style={styles.centerContainer}>
            <Ionicons name="flag-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>No decisions found</Text>
            <Text style={styles.emptySubtext}>
              AI didn't detect any decisions or agreements in this conversation
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

/**
 * Decision Card Component
 */
interface DecisionCardProps {
  decision: Decision;
  index: number;
}

function DecisionCard({ decision, index }: DecisionCardProps) {
  const categoryColors = {
    technical: '#007AFF',
    business: '#FF9500',
    scheduling: '#34C759',
    process: '#AF52DE',
    other: '#8E8E93',
  };
  
  const categoryIcons = {
    technical: 'code-slash',
    business: 'briefcase',
    scheduling: 'calendar',
    process: 'git-branch',
    other: 'ellipsis-horizontal-circle',
  };
  
  const categoryColor = categoryColors[decision.category || 'other'];
  const categoryIcon = categoryIcons[decision.category || 'other'];
  
  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.cardNumber}>
          <Text style={styles.cardNumberText}>{index + 1}</Text>
        </View>
        <View
          style={[styles.categoryBadge, { backgroundColor: `${categoryColor}15` }]}
        >
          <Ionicons name={categoryIcon as any} size={14} color={categoryColor} />
          <Text style={[styles.categoryText, { color: categoryColor }]}>
            {(decision.category || 'other').toUpperCase()}
          </Text>
        </View>
      </View>
      
      {/* Decision */}
      <Text style={styles.decisionText}>{decision.decision}</Text>
      
      {/* Agreed By */}
      {decision.agreedByNames.length > 0 && (
        <View style={styles.agreedContainer}>
          <Ionicons name="people" size={16} color="#34C759" />
          <Text style={styles.agreedLabel}>Agreed by:</Text>
          <Text style={styles.agreedNames}>
            {decision.agreedByNames.join(', ')}
          </Text>
        </View>
      )}
      
      {/* Context */}
      {decision.context && (
        <View style={styles.contextContainer}>
          <Text style={styles.contextLabel}>Context:</Text>
          <Text style={styles.contextText} numberOfLines={3}>
            {decision.context}
          </Text>
        </View>
      )}
      
      {/* Timestamp */}
      <Text style={styles.timestamp}>
        {new Date(decision.timestamp).toLocaleString()}
      </Text>
    </View>
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
  countContainer: {
    padding: 12,
    backgroundColor: '#F8F8F8',
    alignItems: 'center',
  },
  countText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
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
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  card: {
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF9500',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  decisionText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  agreedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  agreedLabel: {
    fontSize: 13,
    color: '#666',
    marginLeft: 6,
    marginRight: 4,
  },
  agreedNames: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#34C759',
  },
  contextContainer: {
    padding: 12,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    marginBottom: 12,
  },
  contextLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  contextText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#555',
  },
  timestamp: {
    fontSize: 11,
    color: '#999',
    textAlign: 'right',
  },
});

