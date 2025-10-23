/**
 * Action Items List Component
 * Displays and manages AI-extracted action items from conversations
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
import { ActionItem } from '../types/ai';

interface ActionItemsListProps {
  visible: boolean;
  actionItems: ActionItem[];
  loading: boolean;
  error: Error | null;
  onClose: () => void;
  onToggleStatus?: (itemId: string) => void;
  onRetry?: () => void;
}

export function ActionItemsList({
  visible,
  actionItems,
  loading,
  error,
  onClose,
  onToggleStatus,
  onRetry,
}: ActionItemsListProps) {
  const pendingItems = actionItems.filter(item => item.status === 'pending');
  const completedItems = actionItems.filter(item => item.status === 'completed');
  
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
            <Ionicons name="checkmark-circle" size={24} color="#34C759" />
            <Text style={styles.headerTitle}>Action Items</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#007AFF" />
          </TouchableOpacity>
        </View>
        
        {/* Stats */}
        {!loading && !error && actionItems.length > 0 && (
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{pendingItems.length}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, styles.completedNumber]}>
                {completedItems.length}
              </Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
          </View>
        )}
        
        {/* Loading */}
        {loading && (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>
              Extracting action items...
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
            <Text style={styles.errorText}>Failed to extract action items</Text>
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
        
        {/* Action Items */}
        {!loading && !error && actionItems.length > 0 && (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Pending Items */}
            {pendingItems.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  📋 Pending ({pendingItems.length})
                </Text>
                {pendingItems.map((item) => (
                  <ActionItemCard
                    key={item.id}
                    item={item}
                    onToggleStatus={onToggleStatus}
                  />
                ))}
              </View>
            )}
            
            {/* Completed Items */}
            {completedItems.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  ✅ Completed ({completedItems.length})
                </Text>
                {completedItems.map((item) => (
                  <ActionItemCard
                    key={item.id}
                    item={item}
                    onToggleStatus={onToggleStatus}
                  />
                ))}
              </View>
            )}
          </ScrollView>
        )}
        
        {/* Empty State */}
        {!loading && !error && actionItems.length === 0 && (
          <View style={styles.centerContainer}>
            <Ionicons name="checkmark-circle-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>No action items found</Text>
            <Text style={styles.emptySubtext}>
              AI didn't detect any tasks or assignments in this conversation
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

/**
 * Action Item Card Component
 */
interface ActionItemCardProps {
  item: ActionItem;
  onToggleStatus?: (itemId: string) => void;
}

function ActionItemCard({ item, onToggleStatus }: ActionItemCardProps) {
  const isCompleted = item.status === 'completed';
  
  const priorityColors = {
    high: '#FF3B30',
    medium: '#FF9500',
    low: '#34C759',
  };
  
  const priorityIcons = {
    high: 'warning',
    medium: 'alert-circle',
    low: 'information-circle',
  };
  
  return (
    <View style={[styles.card, isCompleted && styles.cardCompleted]}>
      {/* Checkbox */}
      <TouchableOpacity
        onPress={() => onToggleStatus?.(item.id)}
        style={styles.checkbox}
      >
        <Ionicons
          name={isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
          size={24}
          color={isCompleted ? '#34C759' : '#CCC'}
        />
      </TouchableOpacity>
      
      {/* Content */}
      <View style={styles.cardContent}>
        <Text
          style={[styles.taskText, isCompleted && styles.taskTextCompleted]}
          numberOfLines={3}
        >
          {item.task}
        </Text>
        
        {/* Meta */}
        <View style={styles.meta}>
          {/* Priority */}
          <View
            style={[
              styles.priorityBadge,
              { backgroundColor: `${priorityColors[item.priority]}15` },
            ]}
          >
            <Ionicons
              name={priorityIcons[item.priority] as any}
              size={14}
              color={priorityColors[item.priority]}
            />
            <Text
              style={[styles.priorityText, { color: priorityColors[item.priority] }]}
            >
              {item.priority.toUpperCase()}
            </Text>
          </View>
          
          {/* Assignee */}
          {item.assignedToName && (
            <View style={styles.assigneeBadge}>
              <Ionicons name="person" size={12} color="#007AFF" />
              <Text style={styles.assigneeText}>{item.assignedToName}</Text>
            </View>
          )}
          
          {/* Due Date */}
          {item.dueDate && (
            <View style={styles.dueDateBadge}>
              <Ionicons name="calendar" size={12} color="#FF9500" />
              <Text style={styles.dueDateText}>
                {new Date(item.dueDate).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>
        
        {/* Context */}
        {item.context && (
          <Text style={styles.contextText} numberOfLines={2}>
            Context: {item.context}
          </Text>
        )}
      </View>
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
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#F8F8F8',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  completedNumber: {
    color: '#34C759',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 16,
  },
  content: {
    flex: 1,
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
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  card: {
    flexDirection: 'row',
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardCompleted: {
    opacity: 0.6,
    backgroundColor: '#F8F8F8',
  },
  checkbox: {
    paddingTop: 2,
    paddingRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  taskText: {
    fontSize: 15,
    lineHeight: 20,
    color: '#333',
    marginBottom: 8,
  },
  taskTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  assigneeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#E3F2FD',
    marginRight: 8,
    marginBottom: 4,
  },
  assigneeText: {
    fontSize: 11,
    color: '#007AFF',
    marginLeft: 4,
  },
  dueDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#FFF3E0',
    marginBottom: 4,
  },
  dueDateText: {
    fontSize: 11,
    color: '#FF9500',
    marginLeft: 4,
  },
  contextText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
});

