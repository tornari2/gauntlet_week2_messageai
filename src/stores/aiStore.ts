/**
 * AI Store
 * Manages state for AI features using Zustand
 * Handles caching, loading states, and errors for all AI operations
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Timestamp } from 'firebase/firestore';
import { 
  ThreadSummary, 
  ActionItem, 
  Decision, 
  SmartSearchResponse,
  AIState 
} from '../types/ai';
import { Message, User } from '../types';
import { aiService } from '../services/aiService';
import { ragService } from '../services/ragService';

// Helper: Convert Timestamp or Date to Date
const toDate = (value: Timestamp | Date): Date => {
  if (value instanceof Date) {
    return value;
  }
  // It's a Firestore Timestamp - convert it
  if (typeof (value as any).toDate === 'function') {
    return (value as any).toDate();
  }
  // Fallback - treat as timestamp object with seconds
  if ((value as any).seconds) {
    return new Date((value as any).seconds * 1000);
  }
  // Last resort
  return new Date();
};

interface AIActions {
  // Thread Summarization
  getSummary: (chatId: string, messages: Message[], users: Record<string, User>, force?: boolean) => Promise<ThreadSummary>;
  clearSummary: (chatId: string) => void;
  
  // Action Items
  getActionItems: (chatId: string, messages: Message[], users: Record<string, User>, force?: boolean) => Promise<ActionItem[]>;
  clearActionItems: (chatId: string) => void;
  
  // Decisions
  getDecisions: (chatId: string, messages: Message[], users: Record<string, User>, force?: boolean) => Promise<Decision[]>;
  clearDecisions: (chatId: string) => void;
  
  // Smart Search
  search: (query: string, chatId: string) => Promise<SmartSearchResponse>;
  clearSearchResults: () => void;
  
  // Error handling
  clearError: (feature: keyof AIState['errors']) => void;
  clearAllErrors: () => void;
}

/**
 * AI Store using Zustand
 */
export const useAIStore = create<AIState & AIActions>((set, get) => ({
  // Initial state
  loading: {
    summarization: false,
    actionItems: false,
    decisions: false,
    smartSearch: false,
    priority: false,
  },
  
  errors: {
    summarization: null,
    actionItems: null,
    decisions: null,
    smartSearch: null,
    priority: null,
  },
  
  summaries: {},
  actionItems: {},
  decisions: {},
  searchResults: {},
  
  // Actions
  
  /**
   * Get thread summary (with caching)
   */
  getSummary: async (chatId: string, messages: Message[], users: Record<string, User>, force: boolean = false) => {
    // Check cache first (unless force is true)
    if (!force) {
      const cached = get().summaries[chatId];
      if (cached) {
        const generatedDate = toDate(cached.generatedAt);
        const age = Date.now() - generatedDate.getTime();
        if (age < 3600000) { // Cache for 1 hour
          console.log('Returning cached summary');
          return cached;
        }
      }
    }
    
    // Set loading
    set(state => ({
      loading: { ...state.loading, summarization: true },
      errors: { ...state.errors, summarization: null },
    }));
    
    try {
      // Get previous summary if exists (to build upon)
      const previousSummary = get().summaries[chatId];
      
      // Generate summary
      const summary = await aiService.summarizeThread(chatId, messages, users, previousSummary);
      
      // Store in state
      set(state => ({
        summaries: { ...state.summaries, [chatId]: summary },
        loading: { ...state.loading, summarization: false },
      }));
      
      // Cache in AsyncStorage
      try {
        await AsyncStorage.setItem(
          `ai_summary_${chatId}`,
          JSON.stringify(summary)
        );
      } catch (cacheError) {
        console.warn('Failed to cache summary:', cacheError);
      }
      
      return summary;
    } catch (error) {
      set(state => ({
        loading: { ...state.loading, summarization: false },
        errors: { ...state.errors, summarization: error as Error },
      }));
      throw error;
    }
  },
  
  clearSummary: (chatId: string) => {
    set(state => {
      const { [chatId]: _, ...rest } = state.summaries;
      return { summaries: rest };
    });
    AsyncStorage.removeItem(`ai_summary_${chatId}`);
  },
  
  /**
   * Get action items (with caching)
   */
  getActionItems: async (chatId: string, messages: Message[], users: Record<string, User>, force: boolean = false) => {
    // Check cache (unless force is true)
    if (!force) {
      const cached = get().actionItems[chatId];
      if (cached && cached.length > 0) {
        const extractedDate = toDate(cached[0].extractedAt);
        const age = Date.now() - extractedDate.getTime();
        if (age < 1800000) { // Cache for 30 minutes
          console.log('Returning cached action items');
          return cached;
        }
      }
    }
    
    // Set loading
    set(state => ({
      loading: { ...state.loading, actionItems: true },
      errors: { ...state.errors, actionItems: null },
    }));
    
    try {
      // Get previous action items if exist (to build upon)
      const previousItems = get().actionItems[chatId];
      
      // Extract action items
      const items = await aiService.extractActionItems(chatId, messages, users, previousItems);
      
      // Store in state
      set(state => ({
        actionItems: { ...state.actionItems, [chatId]: items },
        loading: { ...state.loading, actionItems: false },
      }));
      
      // Cache in AsyncStorage
      try {
        await AsyncStorage.setItem(
          `ai_action_items_${chatId}`,
          JSON.stringify(items)
        );
      } catch (cacheError) {
        console.warn('Failed to cache action items:', cacheError);
      }
      
      return items;
    } catch (error) {
      set(state => ({
        loading: { ...state.loading, actionItems: false },
        errors: { ...state.errors, actionItems: error as Error },
      }));
      throw error;
    }
  },
  
  clearActionItems: (chatId: string) => {
    set(state => {
      const { [chatId]: _, ...rest } = state.actionItems;
      return { actionItems: rest };
    });
    AsyncStorage.removeItem(`ai_action_items_${chatId}`);
  },
  
  /**
   * Get decisions (with caching)
   */
  getDecisions: async (chatId: string, messages: Message[], users: Record<string, User>, force: boolean = false) => {
    // Check cache (unless force is true)
    if (!force) {
      const cached = get().decisions[chatId];
      if (cached && cached.length > 0) {
        const extractedDate = toDate(cached[0].extractedAt);
        const age = Date.now() - extractedDate.getTime();
        if (age < 1800000) { // Cache for 30 minutes
          console.log('Returning cached decisions');
          return cached;
        }
      }
    }
    
    // Set loading
    set(state => ({
      loading: { ...state.loading, decisions: true },
      errors: { ...state.errors, decisions: null },
    }));
    
    try {
      // Get previous decisions if exist (to build upon)
      const previousDecisions = get().decisions[chatId];
      
      // Track decisions
      const decisions = await aiService.trackDecisions(chatId, messages, users, previousDecisions);
      
      // Store in state
      set(state => ({
        decisions: { ...state.decisions, [chatId]: decisions },
        loading: { ...state.loading, decisions: false },
      }));
      
      // Cache in AsyncStorage
      try {
        await AsyncStorage.setItem(
          `ai_decisions_${chatId}`,
          JSON.stringify(decisions)
        );
      } catch (cacheError) {
        console.warn('Failed to cache decisions:', cacheError);
      }
      
      return decisions;
    } catch (error) {
      set(state => ({
        loading: { ...state.loading, decisions: false },
        errors: { ...state.errors, decisions: error as Error },
      }));
      throw error;
    }
  },
  
  clearDecisions: (chatId: string) => {
    set(state => {
      const { [chatId]: _, ...rest } = state.decisions;
      return { decisions: rest };
    });
    AsyncStorage.removeItem(`ai_decisions_${chatId}`);
  },
  
  /**
   * Smart search (with caching)
   */
  search: async (query: string, chatId: string) => {
    const cacheKey = `${chatId}:${query.toLowerCase()}`;
    
    // Check cache
    const cached = get().searchResults[cacheKey];
    if (cached) {
      const age = Date.now() - new Date(cached.searchedAt).getTime();
      if (age < 300000) { // Cache for 5 minutes
        console.log('Returning cached search results');
        return cached;
      }
    }
    
    // Set loading
    set(state => ({
      loading: { ...state.loading, smartSearch: true },
      errors: { ...state.errors, smartSearch: null },
    }));
    
    try {
      // Perform smart search with RAG
      const results = await ragService.semanticSearch(query, chatId);
      
      // Store in state
      set(state => ({
        searchResults: { ...state.searchResults, [cacheKey]: results },
        loading: { ...state.loading, smartSearch: false },
      }));
      
      return results;
    } catch (error) {
      set(state => ({
        loading: { ...state.loading, smartSearch: false },
        errors: { ...state.errors, smartSearch: error as Error },
      }));
      throw error;
    }
  },
  
  clearSearchResults: () => {
    set({ searchResults: {} });
  },
  
  /**
   * Error handling
   */
  clearError: (feature: keyof AIState['errors']) => {
    set(state => ({
      errors: { ...state.errors, [feature]: null },
    }));
  },
  
  clearAllErrors: () => {
    set({
      errors: {
        summarization: null,
        actionItems: null,
        decisions: null,
        smartSearch: null,
        priority: null,
      },
    });
  },
}));

