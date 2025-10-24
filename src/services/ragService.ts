/**
 * RAG Service
 * Handles vector embeddings and semantic search using Pinecone + OpenAI
 * Implements Retrieval-Augmented Generation for Smart Search and Decision Tracking
 */

import OpenAI from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';
import { Message } from '../types';
import { MessageEmbedding, RAGRetrievalOptions, SearchResult, SmartSearchResponse, AIServiceError } from '../types/ai';
import { OPENAI_CONFIG, PINECONE_CONFIG, PERFORMANCE_CONFIG } from '../config/aiConfig';

/**
 * Initialize OpenAI client
 */
const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

/**
 * Initialize Pinecone client
 * Note: This will be initialized lazily on first use
 */
let pineconeClient: Pinecone | null = null;
let pineconeIndex: any = null;

/**
 * Initialize Pinecone (lazy initialization)
 */
async function initializePinecone(): Promise<void> {
  if (pineconeClient && pineconeIndex) {
    return; // Already initialized
  }
  
  try {
    const apiKey = process.env.EXPO_PUBLIC_PINECONE_API_KEY;
    
    if (!apiKey) {
      throw new Error('EXPO_PUBLIC_PINECONE_API_KEY not found in environment');
    }
    
    pineconeClient = new Pinecone({
      apiKey: apiKey,
    });
    
    // Get index
    pineconeIndex = pineconeClient.index(PINECONE_CONFIG.indexName);
    
    console.log('✅ Pinecone initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Pinecone:', error);
    throw new AIServiceError(
      'Failed to initialize Pinecone',
      'api_error',
      error as Error
    );
  }
}

/**
 * Create embedding for text using OpenAI
 */
async function createEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: OPENAI_CONFIG.embeddingModel,
      input: text,
      encoding_format: 'float',
    });
    
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error creating embedding:', error);
    throw new AIServiceError(
      'Failed to create embedding',
      'api_error',
      error as Error
    );
  }
}

/**
 * Embed and store a message in Pinecone
 * Called when new messages are sent/received
 */
export async function embedMessage(
  message: Message,
  chatId: string,
  senderName?: string
): Promise<void> {
  try {
    // Initialize Pinecone if needed
    await initializePinecone();
    
    if (!pineconeIndex) {
      throw new Error('Pinecone index not initialized');
    }
    
    // Create embedding
    const embedding = await createEmbedding(message.text);
    
    // Prepare metadata
    const metadata = {
      messageId: message.id,
      chatId: chatId,
      senderId: message.senderId,
      senderName: senderName || 'Unknown',
      text: message.text,
      timestamp: message.timestamp instanceof Date 
        ? message.timestamp.toISOString() 
        : message.timestamp.toDate().toISOString(),
    };
    
    // Upsert to Pinecone
    await pineconeIndex.upsert([{
      id: message.id,
      values: embedding,
      metadata: metadata,
    }]);
    
    console.log(`✅ Embedded message ${message.id}`);
  } catch (error) {
    console.error('Error embedding message:', error);
    // Don't throw - embedding failures shouldn't break message sending
    // Just log the error for monitoring
  }
}

/**
 * Batch embed multiple messages
 * Useful for initial setup or backfilling
 */
export async function embedMessages(
  messages: Message[],
  chatId: string,
  users: Record<string, any>
): Promise<void> {
  try {
    await initializePinecone();
    
    if (!pineconeIndex) {
      throw new Error('Pinecone index not initialized');
    }
    
    console.log(`Embedding ${messages.length} messages...`);
    
    // Process in batches of 10 to avoid rate limits
    const batchSize = 10;
    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      
      // Create embeddings for batch
      const embeddings = await Promise.all(
        batch.map(msg => createEmbedding(msg.text))
      );
      
      // Prepare vectors for Pinecone
      const vectors = batch.map((msg, idx) => ({
        id: msg.id,
        values: embeddings[idx],
        metadata: {
          messageId: msg.id,
          chatId: chatId,
          senderId: msg.senderId,
          senderName: users[msg.senderId]?.displayName || 'Unknown',
          text: msg.text,
          timestamp: msg.timestamp instanceof Date 
            ? msg.timestamp.toISOString() 
            : msg.timestamp.toDate().toISOString(),
        },
      }));
      
      // Upsert batch
      await pineconeIndex.upsert(vectors);
      
      console.log(`✅ Embedded batch ${i / batchSize + 1} of ${Math.ceil(messages.length / batchSize)}`);
      
      // Small delay to avoid rate limits
      if (i + batchSize < messages.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log(`✅ Successfully embedded ${messages.length} messages`);
  } catch (error) {
    console.error('Error batch embedding messages:', error);
    throw new AIServiceError(
      'Failed to embed messages',
      'api_error',
      error as Error
    );
  }
}

/**
 * Retrieve relevant messages using vector similarity search
 * This is the core RAG retrieval step
 */
export async function retrieveRelevantMessages(
  query: string,
  chatId: string,
  options: RAGRetrievalOptions = {}
): Promise<Message[]> {
  try {
    await initializePinecone();
    
    if (!pineconeIndex) {
      throw new Error('Pinecone index not initialized');
    }
    
    const {
      topK = 10,
      filter = {},
      includeMetadata = true,
    } = options;
    
    // Create query embedding
    const queryEmbedding = await createEmbedding(query);
    
    // Search Pinecone
    const searchResults = await pineconeIndex.query({
      vector: queryEmbedding,
      topK: topK,
      filter: {
        chatId: chatId,
        ...filter,
      },
      includeMetadata: includeMetadata,
    });
    
    // Convert to Message objects
    const messages: Message[] = searchResults.matches.map((match: any) => ({
      id: match.metadata.messageId,
      text: match.metadata.text,
      senderId: match.metadata.senderId,
      timestamp: new Date(match.metadata.timestamp),
      readBy: [],
    }));
    
    console.log(`✅ Retrieved ${messages.length} relevant messages for query: "${query}"`);
    
    return messages;
  } catch (error) {
    console.error('Error retrieving relevant messages:', error);
    throw new AIServiceError(
      'Failed to retrieve relevant messages',
      'api_error',
      error as Error
    );
  }
}

/**
 * FEATURE 3: Smart Search with RAG
 * Semantic search that finds messages by meaning, not just keywords
 */
export async function smartSearch(
  query: string,
  chatId: string,
  topK: number = 10
): Promise<SmartSearchResponse> {
  try {
    await initializePinecone();
    
    if (!pineconeIndex) {
      throw new Error('Pinecone index not initialized');
    }
    
    // Step 1: RETRIEVAL - Get relevant messages using vector similarity
    const queryEmbedding = await createEmbedding(query);
    
    const searchResults = await pineconeIndex.query({
      vector: queryEmbedding,
      topK: topK,
      filter: {
        chatId: chatId,
      },
      includeMetadata: true,
    });
    
    // Convert to SearchResult objects
    const results: SearchResult[] = searchResults.matches.map((match: any) => ({
      messageId: match.metadata.messageId,
      text: match.metadata.text,
      senderId: match.metadata.senderId,
      senderName: match.metadata.senderName,
      timestamp: new Date(match.metadata.timestamp),
      relevanceScore: match.score,
      chatId: chatId,
    }));
    
    // Step 2: GENERATION - Use LLM to generate answer based on retrieved messages
    let answer: string | undefined;
    
    if (results.length > 0) {
      const formattedMessages = results
        .map(r => `[${r.senderName}]: ${r.text}`)
        .join('\n');
      
      try {
        const completion = await openai.chat.completions.create({
          model: OPENAI_CONFIG.model,
          messages: [{
            role: 'system',
            content: 'You answer questions based on team chat messages. Be concise and reference specific messages.'
          }, {
            role: 'user',
            content: `Based on these relevant messages:

${formattedMessages}

Answer this question: ${query}

Provide a clear, concise answer. Reference specific people or messages when relevant.`
          }],
          temperature: 0.7,
          max_tokens: 300,
        });
        
        answer = completion.choices[0].message.content || undefined;
      } catch (error) {
        console.error('Error generating answer:', error);
        // Continue without answer - still return search results
      }
    }
    
    const response: SmartSearchResponse = {
      query,
      results,
      answer,
      totalResults: results.length,
      searchedAt: new Date(),
    };
    
    console.log(`✅ Smart search completed: found ${results.length} results`);
    
    return response;
  } catch (error) {
    console.error('Error in smart search:', error);
    throw new AIServiceError(
      'Smart search failed',
      'api_error',
      error as Error
    );
  }
}

/**
 * Delete messages from Pinecone (when messages are deleted)
 */
export async function deleteEmbeddings(messageIds: string[]): Promise<void> {
  try {
    await initializePinecone();
    
    if (!pineconeIndex) {
      throw new Error('Pinecone index not initialized');
    }
    
    await pineconeIndex.deleteMany(messageIds);
    
    console.log(`✅ Deleted ${messageIds.length} embeddings`);
  } catch (error) {
    console.error('Error deleting embeddings:', error);
    // Don't throw - deletion failures shouldn't break the app
  }
}

/**
 * Export RAG service
 */
export const ragService = {
  embedMessage,
  embedMessages,
  retrieveRelevantMessages,
  smartSearch,
  deleteEmbeddings,
  initializePinecone,
};

