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
  
  // Queue of pending notifications
  notificationQueue: NotificationData[];
  
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
  notificationQueue: [],
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
    
    // If already showing a notification, add to queue
    if (state.isShowingNotification) {
      console.log('📬 Adding notification to queue');
      set((state) => ({
        notificationQueue: [...state.notificationQueue, notification],
      }));
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
    set({ activeChatId: chatId });
  },
  
  clearAllNotifications: () => {
    set({
      currentNotification: null,
      notificationQueue: [],
      isShowingNotification: false,
    });
  },
  
  processNextNotification: () => {
    const state = get();
    
    if (state.notificationQueue.length === 0) {
      return;
    }
    
    // Get the next notification from the queue
    const nextNotification = state.notificationQueue[0];
    const remainingQueue = state.notificationQueue.slice(1);
    
    set({
      currentNotification: nextNotification,
      notificationQueue: remainingQueue,
      isShowingNotification: true,
    });
  },
}));

