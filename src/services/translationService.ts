/**
 * Translation Service
 * Core translation functionality using Firebase Cloud Functions + OpenAI
 */

import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  TranslationResult,
  TranslationError,
  FormalityLevel,
  SlangExplanation,
  CulturalContext,
  MultilingualSummary,
} from '../types/translation';
import { Message, User } from '../types';

// ==================== CACHING CONFIGURATION ====================

const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
const CACHE_PREFIX = 'ai_cache_v1_';

/**
 * Simple string hash function for cache keys
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Generic cache getter
 */
async function getCachedResult<T>(
  feature: string,
  input: string,
  params: Record<string, any> = {}
): Promise<T | null> {
  try {
    const paramsStr = JSON.stringify(params);
    const hash = hashString(input + paramsStr);
    const key = `${CACHE_PREFIX}${feature}_${hash}`;
    
    const cached = await AsyncStorage.getItem(key);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      
      // Check if cache is still valid
      if (Date.now() - timestamp < CACHE_DURATION) {
        console.log(`[Cache HIT] ${feature}`);
        return data as T;
      } else {
        // Cache expired, remove it
        await AsyncStorage.removeItem(key);
      }
    }
  } catch (error) {
    console.error(`Error reading cache for ${feature}:`, error);
  }
  
  console.log(`[Cache MISS] ${feature}`);
  return null;
}

/**
 * Generic cache setter
 */
async function setCachedResult<T>(
  feature: string,
  input: string,
  params: Record<string, any> = {},
  data: T
): Promise<void> {
  try {
    const paramsStr = JSON.stringify(params);
    const hash = hashString(input + paramsStr);
    const key = `${CACHE_PREFIX}${feature}_${hash}`;
    
    const cacheEntry = {
      data,
      timestamp: Date.now(),
    };
    
    await AsyncStorage.setItem(key, JSON.stringify(cacheEntry));
  } catch (error) {
    console.error(`Error writing cache for ${feature}:`, error);
    // Don't throw - caching is not critical
  }
}

/**
 * Helper: Retry with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error as Error;
      
      console.error(`Attempt ${attempt + 1} failed:`, error);
      
      // Wait before retrying
      if (attempt < maxRetries - 1) {
        const delay = 1000 * Math.pow(2, attempt); // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw new TranslationError(
    'Translation service request failed after retries',
    'api_error',
    lastError!
  );
}

/**
 * 1. Translate Text
 * Translates text from one language to another using OpenAI
 */
export async function translateText(
  text: string,
  targetLanguage: string,
  sourceLanguage?: string
): Promise<TranslationResult> {
  if (!text || text.trim().length === 0) {
    throw new TranslationError(
      'Text cannot be empty',
      'invalid_input'
    );
  }

  // Check cache first
  const cacheParams = { targetLanguage, sourceLanguage: sourceLanguage || 'auto' };
  const cached = await getCachedResult<TranslationResult>('translate', text, cacheParams);
  if (cached) {
    return cached;
  }

  const translateTextFn = httpsCallable(functions, 'translateText');
  
  return retryWithBackoff(async () => {
    try {
      const result = await translateTextFn({
        text,
        targetLanguage,
        sourceLanguage,
      });

      const data = result.data as any;

      const translationResult: TranslationResult = {
        translatedText: data.translatedText || '',
        sourceLanguage: data.sourceLanguage || sourceLanguage || 'unknown',
        targetLanguage: data.targetLanguage || targetLanguage,
        confidence: data.confidence || 0.8,
      };

      // Cache the result
      await setCachedResult('translate', text, cacheParams, translationResult);

      return translationResult;
    } catch (error) {
      console.error('translateText function call failed:', error);
      throw error;
    }
  });
}

/**
 * 2. Detect Language
 * Detects the language of a text using OpenAI
 */
export async function detectLanguage(text: string): Promise<string> {
  if (!text || text.trim().length === 0) {
    return 'en';
  }

  // Check cache first
  const cached = await getCachedResult<string>('detectLang', text);
  if (cached) {
    return cached;
  }

  const detectLanguageFn = httpsCallable(functions, 'detectLanguage');
  
  try {
    const result = await detectLanguageFn({ text });
    const data = result.data as any;
    const languageCode = data.languageCode || 'en';
    
    // Cache the result
    await setCachedResult('detectLang', text, {}, languageCode);
    
    return languageCode;
  } catch (error) {
    console.error('detectLanguage function call failed:', error);
    return 'en';
  }
}

/**
 * 3. Adjust Formality
 * Rewrites text with the specified formality level
 */
export async function adjustFormality(
  text: string,
  formalityLevel: FormalityLevel,
  targetLanguage: string
): Promise<string> {
  if (!text || text.trim().length === 0) {
    throw new TranslationError(
      'Text cannot be empty',
      'invalid_input'
    );
  }

  // Check cache first
  const cacheParams = { formalityLevel, targetLanguage };
  const cached = await getCachedResult<string>('formality', text, cacheParams);
  if (cached) {
    return cached;
  }

  const formalityFunction = httpsCallable(functions, 'adjustFormality');
  
  return retryWithBackoff(async () => {
    const result = await formalityFunction({
      text,
      formalityLevel,
      targetLanguage,
    });

    const data = result.data as any;
    const adjustedText = data.adjustedText || text;
    
    // Cache the result
    await setCachedResult('formality', text, cacheParams, adjustedText);
    
    return adjustedText;
  });
}

/**
 * 4. Explain Slang/Idioms
 * Identifies and explains slang and idioms in text
 */
export async function explainSlang(
  text: string,
  detectedLanguage: string
): Promise<SlangExplanation[]> {
  if (!text || text.trim().length === 0) {
    return [];
  }

  // Check cache first
  const cacheParams = { detectedLanguage };
  const cached = await getCachedResult<SlangExplanation[]>('slang', text, cacheParams);
  if (cached) {
    return cached;
  }

  const explainSlangFn = httpsCallable(functions, 'explainSlang');
  
  return retryWithBackoff(async () => {
    try {
      const result = await explainSlangFn({
        text,
        detectedLanguage,
      });

      const data = result.data as any;
      const explanations = data.explanations || [];
      
      // Cache the result
      await setCachedResult('slang', text, cacheParams, explanations);
      
      return explanations;
    } catch (error) {
      console.error('explainSlang function call failed:', error);
      throw error;
    }
  });
}

/**
 * 5. Get Cultural Context
 * Provides cultural context and insights for a message
 */
export async function getCulturalContext(
  text: string,
  detectedLanguage: string
): Promise<CulturalContext> {
  if (!text || text.trim().length === 0) {
    throw new TranslationError(
      'Text cannot be empty',
      'invalid_input'
    );
  }

  // Check cache first
  const cacheParams = { detectedLanguage };
  const cached = await getCachedResult<CulturalContext>('cultural', text, cacheParams);
  if (cached) {
    return cached;
  }

  const getCulturalContextFn = httpsCallable(functions, 'getCulturalContext');
  
  return retryWithBackoff(async () => {
    try {
      const result = await getCulturalContextFn({
        text,
        detectedLanguage,
      });

      const data = result.data as any;
      
      const culturalContext: CulturalContext = {
        messageText: text,
        detectedLanguage,
        culturalInsights: data.culturalInsights || 'No specific cultural context detected.',
        references: data.references || [],
      };
      
      // Cache the result
      await setCachedResult('cultural', text, cacheParams, culturalContext);
      
      return culturalContext;
    } catch (error) {
      console.error('getCulturalContext function call failed:', error);
      throw error;
    }
  });
}

/**
 * 6. Summarize Multilingual Thread
 * Generates a summary of a conversation in the user's preferred language
 */
export async function summarizeMultilingualThread(
  messages: Message[],
  users: Record<string, User>,
  userLanguage: string
): Promise<MultilingualSummary> {
  if (messages.length < 5) {
    throw new TranslationError(
      'Need at least 5 messages to summarize',
      'invalid_input'
    );
  }

  // Format messages for API
  const formattedMessages = messages.map((msg) => ({
    id: msg.id,
    text: msg.text,
    senderId: msg.senderId,
    senderName: users[msg.senderId]?.displayName || 'Unknown User',
    timestamp: msg.timestamp instanceof Date 
      ? msg.timestamp.toISOString() 
      : msg.timestamp.toDate().toISOString(),
    detectedLanguage: msg.detectedLanguage || 'unknown',
  }));

  const summaryFunction = httpsCallable(functions, 'summarizeMultilingualThread');
  
  return retryWithBackoff(async () => {
    const result = await summaryFunction({
      messages: formattedMessages,
      userLanguage,
    });

    const data = result.data as any;
    
    return {
      overview: data.overview || '',
      participantSummaries: data.participantSummaries || [],
      languagesDetected: data.languagesDetected || [],
      generatedIn: data.generatedIn || userLanguage,
      timestamp: new Date(),
    };
  });
}

// ==================== CACHING ====================

/**
 * Get cached translation from AsyncStorage
 */
export async function getCachedTranslation(
  messageId: string,
  targetLanguage: string
): Promise<string | null> {
  try {
    const key = `translation_cache_${messageId}_${targetLanguage}`;
    const cached = await AsyncStorage.getItem(key);
    return cached;
  } catch (error) {
    console.error('Error getting cached translation:', error);
    return null;
  }
}

/**
 * Cache translation in AsyncStorage
 */
export async function cacheTranslation(
  messageId: string,
  targetLanguage: string,
  translatedText: string
): Promise<void> {
  try {
    const key = `translation_cache_${messageId}_${targetLanguage}`;
    await AsyncStorage.setItem(key, translatedText);
  } catch (error) {
    console.error('Error caching translation:', error);
    // Don't throw - caching is not critical
  }
}

/**
 * Get cached cultural context
 */
export async function getCachedCulturalContext(
  messageId: string
): Promise<CulturalContext | null> {
  try {
    const key = `cultural_context_${messageId}`;
    const cached = await AsyncStorage.getItem(key);
    
    if (cached) {
      const parsed = JSON.parse(cached);
      
      // Check if cache is still valid (24 hours)
      const cacheTime = parsed.cachedAt || 0;
      const now = Date.now();
      const hoursSinceCached = (now - cacheTime) / (1000 * 60 * 60);
      
      if (hoursSinceCached < 24) {
        return parsed.data;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting cached cultural context:', error);
    return null;
  }
}

/**
 * Cache cultural context
 */
export async function cacheCulturalContext(
  messageId: string,
  context: CulturalContext
): Promise<void> {
  try {
    const key = `cultural_context_${messageId}`;
    const data = {
      data: context,
      cachedAt: Date.now(),
    };
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error caching cultural context:', error);
    // Don't throw - caching is not critical
  }
}

/**
 * Get cached slang explanations
 */
export async function getCachedSlangExplanations(
  messageId: string
): Promise<SlangExplanation[] | null> {
  try {
    const key = `slang_explanations_${messageId}`;
    const cached = await AsyncStorage.getItem(key);
    
    if (cached) {
      const parsed = JSON.parse(cached);
      
      // Check if cache is still valid (24 hours)
      const cacheTime = parsed.cachedAt || 0;
      const now = Date.now();
      const hoursSinceCached = (now - cacheTime) / (1000 * 60 * 60);
      
      if (hoursSinceCached < 24) {
        return parsed.data;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting cached slang explanations:', error);
    return null;
  }
}

/**
 * Cache slang explanations
 */
export async function cacheSlangExplanations(
  messageId: string,
  explanations: SlangExplanation[]
): Promise<void> {
  try {
    const key = `slang_explanations_${messageId}`;
    const data = {
      data: explanations,
      cachedAt: Date.now(),
    };
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error caching slang explanations:', error);
    // Don't throw - caching is not critical
  }
}

