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
  onRetry?: () => void;
  onShareToChat?: (text: string) => void;
}

export function ActionItemsList({
  visible,
  actionItems,
  loading,
  error,
  onClose,
  onRetry,
  onShareToChat,
}: ActionItemsListProps) {
  
  const formatItemsForSharing = () => {
    if (actionItems.length === 0) return '';
    
    let text = `✅ **Action Items**\n\n`;
    actionItems.forEach((item, index) => {
      text += `${index + 1}. ${item.task}\n`;
      if (item.assignedToName) {
        text += `   👤 Assigned to: ${item.assignedToName}\n`;
      }
      if (item.dueDate) {
        const date = item.dueDate instanceof Date ? item.dueDate : new Date(item.dueDate);
        text += `   📅 Due: ${date.toLocaleDateString()}\n`;
      }
      text += `   🎯 Priority: ${item.priority}\n`;
      if (item.context) {
        text += `   📝 Context: ${item.context}\n`;
      }
      text += `\n`;
    });
    
    text += `_${actionItems.length} action item${actionItems.length !== 1 ? 's' : ''} extracted_`;
    return text;
  };
  
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
            <View style={styles.section}>
              <Text style={styles.countText}>
                {actionItems.length} action item{actionItems.length !== 1 ? 's' : ''} found
              </Text>
              {actionItems.map((item) => (
                <ActionItemCard
                  key={item.id}
                  item={item}
                />
              ))}
            </View>
            
            {/* Share Button */}
            {onShareToChat && (
              <TouchableOpacity 
                style={styles.shareButton}
                onPress={() => {
                  const text = formatItemsForSharing();
                  onShareToChat(text);
                  onClose();
                }}
              >
                <Ionicons name="send" size={20} color="#FFF" />
                <Text style={styles.shareButtonText}>Share to Chat</Text>
              </TouchableOpacity>
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
}

function ActionItemCard({ item }: ActionItemCardProps) {
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
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.taskText}>{item.task}</Text>
        <View style={[styles.priorityBadge, { backgroundColor: priorityColors[item.priority] }]}>
          <Ionicons 
            name={priorityIcons[item.priority] as any} 
            size={12} 
            color="#FFF" 
          />
          <Text style={styles.priorityText}>{item.priority}</Text>
        </View>
      </View>
      
      {item.assignedToName && (
        <View style={styles.metaRow}>
          <Ionicons name="person" size={16} color="#666" />
          <Text style={styles.metaText}>{item.assignedToName}</Text>
        </View>
      )}
      
      {item.dueDate && (
        <View style={styles.metaRow}>
          <Ionicons name="calendar" size={16} color="#666" />
          <Text style={styles.metaText}>
            {new Date(item.dueDate).toLocaleDateString()}
          </Text>
        </View>
      )}
      
      {item.context && (
        <View style={styles.contextContainer}>
          <Text style={styles.contextLabel}>Context:</Text>
          <Text style={styles.contextText}>{item.context}</Text>
        </View>
      )}
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

