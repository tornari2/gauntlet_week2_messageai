/**
 * SwipeableChatListItem Component
 * 
 * Wraps ChatListItem with swipe-to-delete functionality
 * Swipe left to reveal a delete button
 */

import React, { useRef } from 'react';
import {
  View,
  Animated,
  PanResponder,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  Dimensions,
} from 'react-native';
import { ChatWithDetails } from '../types';
import { ChatListItem } from './ChatListItem';
import { useChatStore } from '../stores/chatStore';
import { useAuthStore } from '../stores/authStore';

interface SwipeableChatListItemProps {
  chat: ChatWithDetails;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = -SCREEN_WIDTH * 0.3; // Swipe 30% of screen to activate delete
const DELETE_BUTTON_WIDTH = 80;

export const SwipeableChatListItem: React.FC<SwipeableChatListItemProps> = ({ chat }) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const deleteChat = useChatStore((state) => state.deleteChat);
  const user = useAuthStore((state) => state.user);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only activate if horizontal swipe is significant
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderGrant: () => {
        // Gesture started
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow left swipe (negative dx)
        if (gestureState.dx < 0) {
          translateX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        
        // If swiped past threshold, show delete button
        if (gestureState.dx < SWIPE_THRESHOLD) {
          Animated.spring(translateX, {
            toValue: -DELETE_BUTTON_WIDTH,
            useNativeDriver: true,
            bounciness: 0,
          }).start();
        } else {
          // Otherwise, spring back to original position
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 8,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        // Spring back if gesture is interrupted
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 8,
        }).start();
      },
    })
  ).current;

  const handleDelete = () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to delete chats');
      return;
    }

    Alert.alert(
      'Delete Chat',
      `Are you sure you want to delete this chat${chat.type === 'direct' ? ` with ${chat.otherUserName}` : ''}? This will delete all messages.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            // Close the swipe
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
              bounciness: 8,
            }).start();
          },
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteChat(chat.id, user.uid);
              // Animate out before deletion
              Animated.timing(translateX, {
                toValue: -SCREEN_WIDTH,
                duration: 200,
                useNativeDriver: true,
              }).start();
            } catch (error) {
              console.error('Error deleting chat:', error);
              Alert.alert('Error', 'Failed to delete chat. Please try again.');
              // Reset position on error
              Animated.spring(translateX, {
                toValue: 0,
                useNativeDriver: true,
                bounciness: 8,
              }).start();
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Delete button (hidden underneath) */}
      <View style={styles.deleteButtonContainer}>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          activeOpacity={0.7}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>

      {/* Swipeable chat item */}
      <Animated.View
        style={[
          styles.swipeableContainer,
          {
            transform: [{ translateX }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <ChatListItem chat={chat} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: '#fff',
  },
  deleteButtonContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: DELETE_BUTTON_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FF3B30',
  },
  deleteButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  swipeableContainer: {
    backgroundColor: '#fff',
  },
});

