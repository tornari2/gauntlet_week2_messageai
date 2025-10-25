/**
 * Translation Store
 * Manages translation state, language preferences, and AI features
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Message, User } from '../types';
import {
  FormalityLevel,
  SlangExplanation,
  CulturalContext,
  MultilingualSummary,
} from '../types/translation';
import * as translationService from '../services/translationService';
import * as languageService from '../services/languageService';

interface TranslationState {
  // User language preference
  userLanguage: string;
  
  // Per-chat auto-translate settings (chatId -> boolean)
  autoTranslateEnabled: Record<string, boolean>;
  
  // Translation cache (messageId -> language -> translation)
  translations: Record<string, Record<string, string>>;
  
  // Loading states
  translating: Record<string, boolean>; // messageId -> loading
  detectingLanguage: Record<string, boolean>; // messageId -> loading
  loadingCulturalContext: Record<string, boolean>;
  loadingSlangExplanations: Record<string, boolean>;
  loadingFormality: boolean;
  loadingSummary: Record<string, boolean>; // chatId -> loading
  
  // Errors
  errors: Record<string, Error | null>;
  
  // Cultural context cache
  culturalContexts: Record<string, CulturalContext>;
  
  // Slang explanations cache
  slangExplanations: Record<string, SlangExplanation[]>;
  
  // Summaries cache
  summaries: Record<string, MultilingualSummary>; // chatId -> summary
}

interface TranslationActions {
  // Language preference
  setUserLanguage: (language: string, userId: string) => Promise<void>;
  loadUserLanguage: (userId: string) => Promise<void>;
  
  // Auto-translate per-chat settings
  setAutoTranslate: (chatId: string, enabled: boolean) => Promise<void>;
  loadAutoTranslateSetting: (chatId: string) => Promise<void>;
  isAutoTranslateEnabled: (chatId: string) => boolean;
  
  // Translation
  translateMessage: (messageId: string, text: string, targetLanguage: string, sourceLanguage?: string) => Promise<string>;
  
  // Language detection
  detectLanguage: (messageId: string, text: string) => Promise<string>;
  
  // Cultural context
  getCulturalContext: (messageId: string, text: string, detectedLanguage: string) => Promise<CulturalContext>;
  
  // Slang explanations
  getSlangExplanations: (messageId: string, text: string, detectedLanguage: string) => Promise<SlangExplanation[]>;
  
  // Formality adjustment
  adjustFormality: (text: string, level: FormalityLevel, targetLanguage: string) => Promise<string>;
  
  // Multilingual summary
  getSummary: (chatId: string, messages: Message[], users: Record<string, User>, forceRefresh?: boolean) => Promise<MultilingualSummary>;
  
  // Clear cache
  clearTranslationCache: (messageId?: string) => void;
  clearError: (key: string) => void;
}

export const useTranslationStore = create<TranslationState & TranslationActions>((set, get) => ({
  // Initial state
  userLanguage: 'en',
  autoTranslateEnabled: {},
  translations: {},
  translating: {},
  detectingLanguage: {},
  loadingCulturalContext: {},
  loadingSlangExplanations: {},
  loadingFormality: false,
  loadingSummary: {},
  errors: {},
  culturalContexts: {},
  slangExplanations: {},
  summaries: {},
  
  // Actions
  setUserLanguage: async (language, userId) => {
    try {
      await languageService.setUserLanguage(userId, language);
      set({ userLanguage: language });
    } catch (error) {
      console.error('Error setting user language:', error);
      set((state) => ({
        errors: { ...state.errors, userLanguage: error as Error },
      }));
    }
  },
  
  loadUserLanguage: async (userId) => {
    try {
      const language = await languageService.getUserLanguage(userId);
      set({ userLanguage: language });
    } catch (error) {
      console.error('Error loading user language:', error);
      // Fallback to device language
      const deviceLanguage = languageService.getDeviceLanguage();
      set({ userLanguage: deviceLanguage });
    }
  },
  
  // Auto-translate per-chat settings
  setAutoTranslate: async (chatId, enabled) => {
    try {
      // Save to AsyncStorage
      await AsyncStorage.setItem(`autoTranslate_${chatId}`, JSON.stringify(enabled));
      
      // Update store
      set((state) => ({
        autoTranslateEnabled: { ...state.autoTranslateEnabled, [chatId]: enabled },
      }));
      
      console.log(`[AutoTranslate] Set for chat ${chatId}: ${enabled}`);
    } catch (error) {
      console.error('Error saving auto-translate setting:', error);
    }
  },
  
  loadAutoTranslateSetting: async (chatId) => {
    try {
      const stored = await AsyncStorage.getItem(`autoTranslate_${chatId}`);
      const enabled = stored ? JSON.parse(stored) : false; // Default to false
      
      set((state) => ({
        autoTranslateEnabled: { ...state.autoTranslateEnabled, [chatId]: enabled },
      }));
      
      console.log(`[AutoTranslate] Loaded for chat ${chatId}: ${enabled}`);
    } catch (error) {
      console.error('Error loading auto-translate setting:', error);
      // Default to false on error
      set((state) => ({
        autoTranslateEnabled: { ...state.autoTranslateEnabled, [chatId]: false },
      }));
    }
  },
  
  isAutoTranslateEnabled: (chatId) => {
    return get().autoTranslateEnabled[chatId] || false;
  },
  
  translateMessage: async (messageId, text, targetLanguage, sourceLanguage) => {
    // Check cache first
    const cached = get().translations[messageId]?.[targetLanguage];
    if (cached) {
      return cached;
    }
    
    // Check AsyncStorage cache
    const cachedTranslation = await translationService.getCachedTranslation(messageId, targetLanguage);
    if (cachedTranslation) {
      // Store in memory cache
      set((state) => ({
        translations: {
          ...state.translations,
          [messageId]: {
            ...state.translations[messageId],
            [targetLanguage]: cachedTranslation,
          },
        },
      }));
      return cachedTranslation;
    }
    
    // Set loading
    set((state) => ({
      translating: { ...state.translating, [messageId]: true },
      errors: { ...state.errors, [`translate_${messageId}`]: null },
    }));
    
    try {
      const result = await translationService.translateText(text, targetLanguage, sourceLanguage);
      
      // Cache the translation
      await translationService.cacheTranslation(messageId, targetLanguage, result.translatedText);
      
      // Store in memory cache
      set((state) => ({
        translations: {
          ...state.translations,
          [messageId]: {
            ...state.translations[messageId],
            [targetLanguage]: result.translatedText,
          },
        },
        translating: { ...state.translating, [messageId]: false },
      }));
      
      return result.translatedText;
    } catch (error) {
      console.error('Translation error:', error);
      set((state) => ({
        translating: { ...state.translating, [messageId]: false },
        errors: { ...state.errors, [`translate_${messageId}`]: error as Error },
      }));
      throw error;
    }
  },
  
  detectLanguage: async (messageId, text) => {
    // Set loading
    set((state) => ({
      detectingLanguage: { ...state.detectingLanguage, [messageId]: true },
      errors: { ...state.errors, [`detect_${messageId}`]: null },
    }));
    
    try {
      const languageCode = await translationService.detectLanguage(text);
      
      set((state) => ({
        detectingLanguage: { ...state.detectingLanguage, [messageId]: false },
      }));
      
      return languageCode;
    } catch (error: any) {
      console.error('Language detection error:', error);
      set((state) => ({
        detectingLanguage: { ...state.detectingLanguage, [messageId]: false },
        errors: { ...state.errors, [`detect_${messageId}`]: error as Error },
      }));
      return 'en'; // Fallback to English
    }
  },
  
  getCulturalContext: async (messageId, text, detectedLanguage) => {
    // Check memory cache
    const cached = get().culturalContexts[messageId];
    if (cached) {
      return cached;
    }
    
    // Check AsyncStorage cache
    const cachedContext = await translationService.getCachedCulturalContext(messageId);
    if (cachedContext) {
      set((state) => ({
        culturalContexts: { ...state.culturalContexts, [messageId]: cachedContext },
      }));
      return cachedContext;
    }
    
    // Set loading
    set((state) => ({
      loadingCulturalContext: { ...state.loadingCulturalContext, [messageId]: true },
      errors: { ...state.errors, [`cultural_${messageId}`]: null },
    }));
    
    try {
      const context = await translationService.getCulturalContext(text, detectedLanguage);
      
      // Cache it
      await translationService.cacheCulturalContext(messageId, context);
      
      set((state) => ({
        culturalContexts: { ...state.culturalContexts, [messageId]: context },
        loadingCulturalContext: { ...state.loadingCulturalContext, [messageId]: false },
      }));
      
      return context;
    } catch (error) {
      console.error('Cultural context error:', error);
      set((state) => ({
        loadingCulturalContext: { ...state.loadingCulturalContext, [messageId]: false },
        errors: { ...state.errors, [`cultural_${messageId}`]: error as Error },
      }));
      throw error;
    }
  },
  
  getSlangExplanations: async (messageId, text, detectedLanguage) => {
    // Check memory cache
    const cached = get().slangExplanations[messageId];
    if (cached) {
      return cached;
    }
    
    // Check AsyncStorage cache
    const cachedExplanations = await translationService.getCachedSlangExplanations(messageId);
    if (cachedExplanations) {
      set((state) => ({
        slangExplanations: { ...state.slangExplanations, [messageId]: cachedExplanations },
      }));
      return cachedExplanations;
    }
    
    // Set loading
    set((state) => ({
      loadingSlangExplanations: { ...state.loadingSlangExplanations, [messageId]: true },
      errors: { ...state.errors, [`slang_${messageId}`]: null },
    }));
    
    try {
      const explanations = await translationService.explainSlang(text, detectedLanguage);
      
      // Cache it
      await translationService.cacheSlangExplanations(messageId, explanations);
      
      set((state) => ({
        slangExplanations: { ...state.slangExplanations, [messageId]: explanations },
        loadingSlangExplanations: { ...state.loadingSlangExplanations, [messageId]: false },
      }));
      
      return explanations;
    } catch (error) {
      console.error('Slang explanations error:', error);
      set((state) => ({
        loadingSlangExplanations: { ...state.loadingSlangExplanations, [messageId]: false },
        errors: { ...state.errors, [`slang_${messageId}`]: error as Error },
      }));
      throw error;
    }
  },
  
  adjustFormality: async (text, level, targetLanguage) => {
    // Set loading
    set({ loadingFormality: true, errors: { ...get().errors, formality: null } });
    
    try {
      const adjusted = await translationService.adjustFormality(text, level, targetLanguage);
      
      set({ loadingFormality: false });
      
      return adjusted;
    } catch (error) {
      console.error('Formality adjustment error:', error);
      set((state) => ({
        loadingFormality: false,
        errors: { ...state.errors, formality: error as Error },
      }));
      throw error;
    }
  },
  
  getSummary: async (chatId, messages, users, forceRefresh = false) => {
    // Check cache if not forcing refresh
    if (!forceRefresh) {
      const cached = get().summaries[chatId];
      if (cached) {
        return cached;
      }
    }
    
    // Set loading
    set((state) => ({
      loadingSummary: { ...state.loadingSummary, [chatId]: true },
      errors: { ...state.errors, [`summary_${chatId}`]: null },
    }));
    
    try {
      const userLanguage = get().userLanguage;
      const summary = await translationService.summarizeMultilingualThread(
        chatId,
        messages,
        users,
        userLanguage
      );
      
      set((state) => ({
        summaries: { ...state.summaries, [chatId]: summary },
        loadingSummary: { ...state.loadingSummary, [chatId]: false },
      }));
      
      return summary;
    } catch (error) {
      console.error('Summary error:', error);
      set((state) => ({
        loadingSummary: { ...state.loadingSummary, [chatId]: false },
        errors: { ...state.errors, [`summary_${chatId}`]: error as Error },
      }));
      throw error;
    }
  },
  
  clearTranslationCache: (messageId) => {
    if (messageId) {
      set((state) => {
        const { [messageId]: _, ...restTranslations } = state.translations;
        return { translations: restTranslations };
      });
    } else {
      set({ translations: {} });
    }
  },
  
  clearError: (key) => {
    set((state) => {
      const { [key]: _, ...restErrors } = state.errors;
      return { errors: restErrors };
    });
  },
}));

