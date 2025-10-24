/**
 * AI Feature Type Definitions
 * Types for Remote Team Professional AI features
 */

import { Timestamp } from 'firebase/firestore';

/**
 * Thread Summarization Types
 */
export interface ThreadSummary {
  id: string;
  chatId: string;
  mainTopics: string[];
  keyPoints: string[];
  participantContributions: {
    userId: string;
    userName: string;
    mainPoints: string[];
  }[];
  summary: string; // 2-3 sentence overview
  messageCount: number;
  timestamp: Timestamp | Date;
  generatedAt: Timestamp | Date;
}

/**
 * Action Items Types
 */
export interface ActionItem {
  id: string;
  chatId: string;
  task: string;
  assignedTo?: string; // User ID
  assignedToName?: string; // User display name
  dueDate?: Timestamp | Date;
  priority: 'high' | 'medium' | 'low';
  context: string; // Surrounding message context
  sourceMessageId: string;
  status: 'pending' | 'completed';
  extractedAt: Timestamp | Date;
}

/**
 * Priority Detection Types
 */
export type MessagePriority = 'urgent' | 'high' | 'medium' | 'low';

export interface PriorityAnalysis {
  messageId: string;
  priority: MessagePriority;
  reasons: string[];
  confidence: number; // 0-1
  suggestedAction?: string;
  analyzedAt: Date;
}

export interface MessageAIMetadata {
  priority?: MessagePriority;
  priorityReasons?: string[];
  confidence?: number;
  analyzedAt?: Date;
}

/**
 * Decision Tracking Types
 */
export interface Decision {
  id: string;
  chatId: string;
  decision: string;
  agreedBy: string[]; // User IDs who agreed
  agreedByNames: string[]; // User display names
  context: string;
  sourceMessageIds: string[]; // Message IDs where decision was made
  timestamp: Timestamp | Date;
  category?: 'technical' | 'business' | 'scheduling' | 'process' | 'other';
  extractedAt: Timestamp | Date;
}

/**
 * Smart Search Types
 */
export interface SearchResult {
  messageId: string;
  text: string;
  senderId: string;
  senderName?: string;
  timestamp: Date;
  relevanceScore: number; // 0-1 from vector similarity
  chatId: string;
}

export interface SmartSearchResponse {
  query: string;
  results: SearchResult[];
  answer?: string; // LLM-generated answer
  totalResults: number;
  searchedAt: Date;
}

/**
 * RAG Service Types
 */
export interface MessageEmbedding {
  messageId: string;
  chatId: string;
  embedding: number[]; // Vector embedding (1536 dimensions for text-embedding-3-small)
  text: string;
  senderId: string;
  timestamp: Date;
}

export interface RAGRetrievalOptions {
  topK?: number; // Number of results to retrieve (default: 10)
  filter?: Record<string, any>; // Additional Pinecone filters
  includeMetadata?: boolean; // Include message metadata (default: true)
}

/**
 * AI Service Configuration
 */
export interface AIFeatureConfig {
  useRAG: boolean;
  ragTopK: number;
}

export interface AIConfig {
  summarization: AIFeatureConfig;
  actionItems: AIFeatureConfig;
  decisions: AIFeatureConfig;
  smartSearch: AIFeatureConfig;
  priority: {
    enabled: boolean;
    autoAnalyze: boolean; // Auto-analyze new messages
  };
}

/**
 * Error Types
 */
export class AIServiceError extends Error {
  constructor(
    message: string,
    public code: 'rate_limit' | 'network' | 'api_error' | 'invalid_input' | 'unknown',
    public originalError?: Error
  ) {
    super(message);
    this.name = 'AIServiceError';
  }
}

/**
 * AI Store State (Zustand)
 */
export interface AIState {
  // Loading states
  loading: {
    summarization: boolean;
    actionItems: boolean;
    decisions: boolean;
    smartSearch: boolean;
    priority: boolean;
  };
  
  // Error states
  errors: {
    summarization: Error | null;
    actionItems: Error | null;
    decisions: Error | null;
    smartSearch: Error | null;
    priority: Error | null;
  };
  
  // Cached results
  summaries: Record<string, ThreadSummary>; // chatId -> summary
  actionItems: Record<string, ActionItem[]>; // chatId -> action items
  decisions: Record<string, Decision[]>; // chatId -> decisions
  searchResults: Record<string, SmartSearchResponse>; // query -> results
}

