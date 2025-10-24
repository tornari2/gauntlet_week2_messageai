/**
 * RAG Service (Retrieval Augmented Generation)
 * Handles vector embeddings and semantic search via Firebase Cloud Functions
 * Uses Pinecone for vector storage and OpenAI for embeddings
 */

import { Message } from '../types';
import { createEmbedding, smartSearch as aiSmartSearch } from './aiService';
import { SearchResult, SmartSearchResponse } from '../types/ai';

/**
 * Embed a message and store in Pinecone (via Cloud Function)
 */
export async function embedMessage(
  messageId: string,
  chatId: string,
  text: string,
  senderId: string
): Promise<void> {
  // Skip if text is empty or too short
  if (!text || text.trim().length < 3) {
    return;
  }

  try {
    await createEmbedding(messageId, chatId, text, senderId);
    console.log(`✅ Embedded message ${messageId}`);
  } catch (error) {
    console.error('Error embedding message:', error);
    // Don't throw - embeddings are not critical for app functionality
  }
}

/**
 * Batch embed multiple messages
 */
export async function embedMessages(
  messages: { id: string; chatId: string; text: string; senderId: string }[]
): Promise<void> {
  const embedPromises = messages
    .filter(m => m.text && m.text.trim().length >= 3)
    .map(m => embedMessage(m.id, m.chatId, m.text, m.senderId));

  await Promise.allSettled(embedPromises);
}

/**
 * Semantic search across messages (calls Cloud Function)
 */
export async function semanticSearch(
  query: string,
  chatId: string,
  topK: number = 10
): Promise<SmartSearchResponse> {
  return aiSmartSearch(query, chatId, topK);
}

/**
 * Retrieve relevant messages for RAG (used by AI operations)
 */
export async function retrieveRelevantMessages(
  query: string,
  chatId: string,
  topK: number = 20
): Promise<Message[]> {
  try {
    const searchResponse = await aiSmartSearch(query, chatId, topK);
    
    // Convert SearchResults to Messages
    return searchResponse.results.map((result: SearchResult) => ({
      id: result.messageId,
      text: result.text,
      senderId: result.senderId,
      timestamp: result.timestamp,
      readBy: [],
      // Add relevance as a property for sorting
      _relevanceScore: result.relevanceScore,
    } as any));
  } catch (error) {
    console.error('Error retrieving relevant messages:', error);
    return [];
  }
}

/**
 * Check if Pinecone/RAG is configured and available
 */
export function isRAGAvailable(): boolean {
  // Always return true since we're using Firebase Functions
  // The function will handle errors gracefully
  return true;
}

// Export as service object
export const ragService = {
  embedMessage,
  embedMessages,
  semanticSearch,
  retrieveRelevantMessages,
  isRAGAvailable,
};

export default ragService;
