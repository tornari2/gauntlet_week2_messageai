/**
 * ReadReceiptModal Component
 * 
 * Bottom sheet modal showing detailed read receipt information
 * for group chat messages
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TouchableWithoutFeedback,
} from 'react-native';
import { Message } from '../types';
import { formatReadReceiptList, ReadReceiptUser } from '../utils/readReceiptHelpers';
import { Colors } from '../constants/Colors';

interface ReadReceiptModalProps {
  visible: boolean;
  message: Message | null;
  participants: string[];
  userNames: Record<string, string>;
  onClose: () => void;
}

export const ReadReceiptModal: React.FC<ReadReceiptModalProps> = ({
  visible,
  message,
  participants,
  userNames,
  onClose,
}) => {
  if (!message) {
    return null;
  }

  const { readBy, deliveredTo } = formatReadReceiptList(
    message,
    participants,
    userNames,
    message.senderId
  );

  const renderUser = (user: ReadReceiptUser, hasRead: boolean) => (
    <View key={user.userId} style={styles.userRow}>
      {/* Avatar placeholder */}
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {user.displayName.charAt(0).toUpperCase()}
        </Text>
      </View>
      
      {/* User info */}
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{user.displayName}</Text>
        {hasRead ? (
          <Text style={styles.readStatus}>Read</Text>
        ) : (
          <Text style={styles.deliveredStatus}>Delivered</Text>
        )}
      </View>
      
      {/* Status icon */}
      <View style={styles.statusIcon}>
        {hasRead ? (
          <Text style={styles.readIcon}>✓✓</Text>
        ) : (
          <Text style={styles.deliveredIcon}>✓</Text>
        )}
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      testID="read-receipt-modal"
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContainer}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Message Info</Text>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeButton}
                  testID="close-button"
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Scrollable content */}
              <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Read by section */}
                {readBy.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                      READ BY {readBy.length}
                    </Text>
                    {readBy.map(user => renderUser(user, true))}
                  </View>
                )}

                {/* Delivered to section */}
                {deliveredTo.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                      DELIVERED TO {deliveredTo.length}
                    </Text>
                    {deliveredTo.map(user => renderUser(user, false))}
                  </View>
                )}

                {/* No participants case */}
                {readBy.length === 0 && deliveredTo.length === 0 && (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No recipients</Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    minHeight: 300,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#8E8E93',
    fontWeight: '300',
  },
  content: {
    flex: 1,
  },
  section: {
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#F6F6F6',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2,
  },
  readStatus: {
    fontSize: 13,
    color: '#4FC3F7',
  },
  deliveredStatus: {
    fontSize: 13,
    color: '#8E8E93',
  },
  statusIcon: {
    marginLeft: 8,
  },
  readIcon: {
    fontSize: 16,
    color: '#4FC3F7',
    fontWeight: '700',
  },
  deliveredIcon: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '700',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
  },
});

