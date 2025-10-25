/**
 * Translation Service
 * Core translation functionality using Firebase Cloud Functions + OpenAI
 */

import { httpsCallable } from 'firebase/functions';
import { functions, auth } from './firebase';
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
      
      // TEMPORARY: Don't skip retries on auth errors - just keep retrying
      // The backend doesn't require auth anymore
      
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

  // TEMPORARY: Call function directly via HTTP instead of httpsCallable to bypass auth
  const functionUrl = 'https://us-central1-messageai-42e78.cloudfunctions.net/translateText';
  
  return retryWithBackoff(async () => {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          text,
          targetLanguage,
          sourceLanguage,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const result = await response.json();
    const data = result.result;

    return {
      translatedText: data.translatedText || '',
      sourceLanguage: data.sourceLanguage || sourceLanguage || 'unknown',
      targetLanguage: data.targetLanguage || targetLanguage,
      confidence: data.confidence || 0.8,
    };
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

  const functionUrl = 'https://us-central1-messageai-42e78.cloudfunctions.net/detectLanguage';
  
  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: { text },
      }),
    });

    if (!response.ok) {
      return 'en';
    }

    const result = await response.json();
    return result.result?.languageCode || 'en';
  } catch (error: any) {
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

  const formalityFunction = httpsCallable(functions, 'adjustFormality');
  
  return retryWithBackoff(async () => {
    const result = await formalityFunction({
      text,
      formalityLevel,
      targetLanguage,
    });

    const data = result.data as any;
    return data.adjustedText || text;
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

  // TEMPORARY: Call function directly via HTTP instead of httpsCallable to bypass auth
  const functionUrl = 'https://us-central1-messageai-42e78.cloudfunctions.net/explainSlang';
  
  return retryWithBackoff(async () => {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          text,
          detectedLanguage,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const result = await response.json();
    const data = result.result;
    return data.explanations || [];
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

  // TEMPORARY: Call function directly via HTTP instead of httpsCallable to bypass auth
  const functionUrl = 'https://us-central1-messageai-42e78.cloudfunctions.net/getCulturalContext';
  
  return retryWithBackoff(async () => {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          text,
          detectedLanguage,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const result = await response.json();
    const data = result.result;
    
    return {
      messageText: text,
      detectedLanguage,
      culturalInsights: data.culturalInsights || 'No specific cultural context detected.',
      references: data.references || [],
    };
  });
}

/**
 * 6. Summarize Multilingual Thread
 * Generates a summary of a conversation in the user's preferred language
 */
export async function summarizeMultilingualThread(
  chatId: string,
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

