/**
 * AI Service
 * Core AI functionality using Firebase Cloud Functions
 * Calls server-side functions for OpenAI GPT-4o-mini operations
 */

import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';
import { Message, User } from '../types';
import {
  ThreadSummary,
  ActionItem,
  PriorityAnalysis,
  Decision,
  AIServiceError,
  MessagePriority,
  SmartSearchResponse,
} from '../types/ai';
import { AI_CONFIG } from '../config/aiConfig';

/**
 * Helper: Format messages for API calls
 */
function formatMessagesForAPI(messages: Message[], users: Record<string, User>): any[] {
  return messages.map((msg) => ({
    id: msg.id,
    text: msg.text,
    senderId: msg.senderId,
    senderName: users[msg.senderId]?.displayName || 'Unknown User',
    timestamp: msg.timestamp instanceof Date 
      ? msg.timestamp.toISOString() 
      : msg.timestamp.toDate().toISOString(),
  }));
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
    } catch (error) {
      lastError = error as Error;
      console.error(`Attempt ${attempt + 1} failed:`, error);
      
      // Wait before retrying
      if (attempt < maxRetries - 1) {
        const delay = 1000 * Math.pow(2, attempt); // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw new AIServiceError(
    'AI service request failed after retries',
    'api_error',
    lastError!
  );
}

/**
 * 1. Thread Summarization
 * Generates AI summary of conversation thread
 */
export async function summarizeThread(
  chatId: string,
  messages: Message[],
  users: Record<string, User>
): Promise<ThreadSummary> {
  if (messages.length < 5) {
    throw new AIServiceError(
      'Need at least 5 messages to summarize',
      'invalid_input'
    );
  }

  const formattedMessages = formatMessagesForAPI(messages, users);
  const useRAG = AI_CONFIG.summarization.useRAG && messages.length > 50;

  const summarizeFunction = httpsCallable(functions, 'summarizeThread');
  
  return retryWithBackoff(async () => {
    const result = await summarizeFunction({
      messages: formattedMessages,
      useRAG,
    });

    const data = result.data as any;
    
    return {
      id: `summary_${Date.now()}`,
      chatId,
      mainTopics: data.mainTopics || [],
      keyPoints: data.keyPoints || [],
      participantContributions: data.participantContributions || [],
      summary: data.summary || '',
      messageCount: data.messageCount || messages.length,
      timestamp: new Date(data.timestamp?.seconds * 1000 || Date.now()),
      generatedAt: new Date(),
    };
  });
}

/**
 * 2. Action Items Extraction
 * Extracts tasks and assignments from conversation
 */
export async function extractActionItems(
  chatId: string,
  messages: Message[],
  users: Record<string, User>
): Promise<ActionItem[]> {
  if (messages.length === 0) {
    throw new AIServiceError(
      'No messages to extract action items from',
      'invalid_input'
    );
  }

  const formattedMessages = formatMessagesForAPI(messages, users);

  const extractFunction = httpsCallable(functions, 'extractActionItems');
  
  return retryWithBackoff(async () => {
    const result = await extractFunction({
      messages: formattedMessages,
    });

    const data = result.data as any;
    const actionItems = data.actionItems || [];

    return actionItems.map((item: any) => ({
      id: item.id,
      chatId,
      task: item.task,
      assignedToName: item.assignedToName,
      dueDate: item.dueDate ? new Date(item.dueDate) : undefined,
      priority: item.priority || 'medium',
      context: item.context || '',
      sourceMessageId: item.sourceMessageId || '',
      status: item.status || 'pending',
      extractedAt: new Date(item.extractedAt?.seconds * 1000 || Date.now()),
    }));
  });
}

/**
 * 3. Priority Detection
 * Analyzes message urgency and priority
 */
export async function analyzePriority(
  messageText: string
): Promise<PriorityAnalysis> {
  if (!messageText || messageText.trim().length === 0) {
    // Return default low priority for empty messages
    return {
      messageId: '',
      priority: 'low',
      reasons: ['Empty message'],
      confidence: 1.0,
      analyzedAt: new Date(),
    };
  }

  const priorityFunction = httpsCallable(functions, 'analyzePriority');
  
  return retryWithBackoff(async () => {
    const result = await priorityFunction({
      messageText,
    });

    const data = result.data as any;

    return {
      messageId: '',
      priority: data.priority || 'low',
      reasons: data.reasons || [],
      confidence: data.confidence || 0.5,
      suggestedAction: data.suggestedAction,
      analyzedAt: new Date(data.analyzedAt || Date.now()),
    };
  });
}

/**
 * 4. Decision Tracking
 * Identifies decisions and agreements in conversation
 */
export async function trackDecisions(
  chatId: string,
  messages: Message[],
  users: Record<string, User>
): Promise<Decision[]> {
  if (messages.length === 0) {
    throw new AIServiceError(
      'No messages to track decisions from',
      'invalid_input'
    );
  }

  const formattedMessages = formatMessagesForAPI(messages, users);

  const trackFunction = httpsCallable(functions, 'trackDecisions');
  
  return retryWithBackoff(async () => {
    const result = await trackFunction({
      messages: formattedMessages,
    });

    const data = result.data as any;
    const decisions = data.decisions || [];

    return decisions.map((item: any) => ({
      id: item.id,
      chatId,
      decision: item.decision,
      agreedBy: item.agreedBy || [],
      agreedByNames: item.agreedByNames || [],
      context: item.context || '',
      sourceMessageIds: item.sourceMessageIds || [],
      timestamp: new Date(),
      category: item.category || 'other',
      extractedAt: new Date(item.extractedAt?.seconds * 1000 || Date.now()),
    }));
  });
}

/**
 * 5. Smart Search (RAG)
 * Semantic search across messages with AI-generated answer
 */
export async function smartSearch(
  query: string,
  chatId: string,
  topK: number = 10
): Promise<SmartSearchResponse> {
  if (!query || query.trim().length === 0) {
    throw new AIServiceError(
      'Search query cannot be empty',
      'invalid_input'
    );
  }

  const searchFunction = httpsCallable(functions, 'smartSearch');
  
  return retryWithBackoff(async () => {
    const result = await searchFunction({
      query,
      chatId,
      topK,
    });

    const data = result.data as any;

    return {
      query: data.query || query,
      results: (data.results || []).map((r: any) => ({
        messageId: r.messageId,
        text: r.text,
        senderId: r.senderId,
        senderName: r.senderName,
        timestamp: new Date(r.timestamp),
        relevanceScore: r.relevanceScore || 0,
        chatId: r.chatId || chatId,
      })),
      answer: data.answer || '',
      totalResults: data.totalResults || 0,
      searchedAt: new Date(data.searchedAt || Date.now()),
    };
  });
}

/**
 * Create embedding for a message (for RAG)
 */
export async function createEmbedding(
  messageId: string,
  chatId: string,
  text: string,
  senderId: string
): Promise<void> {
  if (!text || text.trim().length === 0) {
    return; // Skip empty messages
  }

  const embeddingFunction = httpsCallable(functions, 'createEmbedding');
  
  try {
    await embeddingFunction({
      messageId,
      chatId,
      text,
      senderId,
    });
  } catch (error) {
    console.error('Failed to create embedding:', error);
    // Don't throw - embeddings are not critical
  }
}

// Export all functions
export const aiService = {
  summarizeThread,
  extractActionItems,
  analyzePriority,
  trackDecisions,
  smartSearch,
  createEmbedding,
};
