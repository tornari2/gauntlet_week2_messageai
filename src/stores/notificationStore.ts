/**
 * Notification Store
 * 
 * Manages in-app notification state for displaying banners and triggering local notifications.
 * Works with the NotificationBanner component and notification service.
 */

import { create } from 'zustand';
import { NotificationData } from '../components/NotificationBanner';

interface NotificationState {
  // Current in-app notification being displayed
  currentNotification: NotificationData | null;
  
  // Grouped notifications by chat (chatId -> { count, lastNotification })
  groupedNotifications: Record<string, { count: number; lastNotification: NotificationData }>;
  
  // Whether the app is currently showing a notification
  isShowingNotification: boolean;
  
  // Currently active chat (to prevent notifications for active chat)
  activeChatId: string | null;
}

interface NotificationActions {
  // Show a new in-app notification
  showNotification: (notification: NotificationData) => void;
  
  // Dismiss the current notification
  dismissNotification: () => void;
  
  // Set the currently active chat
  setActiveChatId: (chatId: string | null) => void;
  
  // Clear all notifications
  clearAllNotifications: () => void;
  
  // Process next notification in queue
  processNextNotification: () => void;
}

export const useNotificationStore = create<NotificationState & NotificationActions>((set, get) => ({
  // Initial state
  currentNotification: null,
  groupedNotifications: {},
  isShowingNotification: false,
  activeChatId: null,
  
  // Actions
  showNotification: (notification) => {
    const state = get();
    
    // Don't show notification if it's for the currently active chat
    if (state.activeChatId && notification.chatId === state.activeChatId) {
      console.log('🔕 Suppressing notification for active chat');
      return;
    }
    
    // If already showing a notification from a different chat, group it
    if (state.isShowingNotification && state.currentNotification?.chatId !== notification.chatId) {
      set((state) => {
        const chatId = notification.chatId;
        const existing = state.groupedNotifications[chatId];
        
        if (existing) {
          // Update existing group
          console.log(`📬 Grouping notification for chat ${chatId} (${existing.count + 1} total)`);
          return {
            groupedNotifications: {
              ...state.groupedNotifications,
              [chatId]: {
                count: existing.count + 1,
                lastNotification: notification,
              },
            },
          };
        } else {
          // Create new group
          console.log(`📬 Creating notification group for chat ${chatId}`);
          return {
            groupedNotifications: {
              ...state.groupedNotifications,
              [chatId]: {
                count: 1,
                lastNotification: notification,
              },
            },
          };
        }
      });
      return;
    }
    
    // If showing notification from the SAME chat, replace it instead of queueing
    if (state.isShowingNotification && state.currentNotification?.chatId === notification.chatId) {
      console.log(`🔄 Replacing notification for same chat ${notification.chatId}`);
      set({
        currentNotification: notification,
        isShowingNotification: true,
      });
      return;
    }
    
    // Show the notification immediately
    console.log('🔔 Showing notification:', notification.title);
    set({
      currentNotification: notification,
      isShowingNotification: true,
    });
  },
  
  dismissNotification: () => {
    set({
      currentNotification: null,
      isShowingNotification: false,
    });
    
    // Process next notification in queue after a short delay
    setTimeout(() => {
      get().processNextNotification();
    }, 500);
  },
  
  setActiveChatId: (chatId) => {
    // Clear grouped notifications for this chat when user enters it
    set((state) => {
      const { [chatId as string]: _, ...rest } = state.groupedNotifications;
      return {
        activeChatId: chatId,
        groupedNotifications: rest,
      };
    });
  },
  
  clearAllNotifications: () => {
    set({
      currentNotification: null,
      groupedNotifications: {},
      isShowingNotification: false,
    });
  },
  
  processNextNotification: () => {
    const state = get();
    
    // Get the next grouped notification
    const chatIds = Object.keys(state.groupedNotifications);
    if (chatIds.length === 0) {
      return;
    }
    
    // Get the first chat's grouped notification
    const chatId = chatIds[0];
    const group = state.groupedNotifications[chatId];
    
    // Create a notification with count
    const notification = {
      ...group.lastNotification,
      body: group.count > 1 
        ? `(${group.count} new messages) ${group.lastNotification.body}`
        : group.lastNotification.body,
    };
    
    // Remove this group and show the notification
    const { [chatId]: _, ...remainingGroups } = state.groupedNotifications;
    
    console.log(`🔔 Showing grouped notification for ${chatId} (${group.count} messages)`);
    set({
      currentNotification: notification,
      groupedNotifications: remainingGroups,
      isShowingNotification: true,
    });
  },
}));

