/**
 * AI Features Configuration
 * Feature flags and settings for AI capabilities
 */

import { AIConfig } from '../types/ai';

/**
 * AI Feature Configuration
 * Toggle RAG and adjust parameters per feature
 */
export const AI_CONFIG: AIConfig = {
  // Thread Summarization
  summarization: {
    useRAG: false, // Can enable later for topic-specific summaries
    ragTopK: 50, // Number of messages to retrieve if RAG enabled
  },
  
  // Action Items Extraction
  actionItems: {
    useRAG: false, // Can enable later for long threads
    ragTopK: 30,
  },
  
  // Decision Tracking
  decisions: {
    useRAG: true, // ENABLED - improves accuracy for long threads
    ragTopK: 20,
  },
  
  // Smart Search
  smartSearch: {
    useRAG: true, // REQUIRED - this is the main RAG showcase
    ragTopK: 10,
  },
  
  // Priority Detection
  priority: {
    enabled: true,
    autoAnalyze: true, // Automatically analyze new messages
  },
};

/**
 * OpenAI Configuration
 */
export const OPENAI_CONFIG = {
  model: 'gpt-4o-mini', // Fast and cheap
  embeddingModel: 'text-embedding-3-small', // For RAG
  temperature: 0.7,
  maxTokens: 1000,
};

/**
 * Pinecone Configuration
 */
export const PINECONE_CONFIG = {
  indexName: 'messageai-messages', // Pinecone index name
  dimension: 1536, // text-embedding-3-small produces 1536-dim vectors
  metric: 'cosine', // Similarity metric
  environment: process.env.EXPO_PUBLIC_PINECONE_ENVIRONMENT || 'gcp-starter',
};

/**
 * Performance Configuration
 */
export const PERFORMANCE_CONFIG = {
  cacheTimeout: 3600000, // 1 hour in ms
  requestTimeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
};

