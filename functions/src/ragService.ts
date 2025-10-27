/**
 * RAG Service - Retrieval-Augmented Generation
 * 
 * Manages vector embeddings and semantic search over conversation history using Pinecone
 */

import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';
import * as admin from 'firebase-admin';

// Pinecone configuration
const INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'message-ai-conversations';

// Lazy initialize Pinecone
let pinecone: Pinecone | null = null;

function getPinecone(): Pinecone {
  if (!pinecone) {
    const apiKey = process.env.PINECONE_API_KEY;
    if (!apiKey) {
      throw new Error('PINECONE_API_KEY environment variable not set');
    }
    
    pinecone = new Pinecone({
      apiKey,
    });
    
    console.log('✅ Pinecone initialized');
  }
  return pinecone;
}

/**
 * Generate embedding for text using OpenAI
 */
export async function generateEmbedding(
  text: string,
  openai: OpenAI
): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      encoding_format: 'float',
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

/**
 * Store message embedding in Pinecone
 */
export async function storeMessageEmbedding(params: {
  messageId: string;
  chatId: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: number;
  detectedLanguage?: string;
  openai: OpenAI;
}): Promise<void> {
  try {
    const { messageId, chatId, text, senderId, senderName, timestamp, detectedLanguage, openai } = params;
    
    // Generate embedding
    const embedding = await generateEmbedding(text, openai);
    
    // Get Pinecone index
    const pc = getPinecone();
    const index = pc.index(INDEX_NAME);
    
    // Upsert vector with metadata
    await index.upsert([{
      id: messageId,
      values: embedding,
      metadata: {
        chatId,
        text,
        senderId,
        senderName,
        timestamp,
        detectedLanguage: detectedLanguage || 'unknown',
      },
    }]);
    
    console.log(`✅ Stored embedding for message ${messageId} in chat ${chatId}`);
  } catch (error) {
    console.error('Error storing message embedding:', error);
    // Don't throw - embedding storage is not critical
  }
}

/**
 * Search for messages semantically using Pinecone
 */
export async function searchMessages(params: {
  chatId: string;
  query: string;
  limit?: number;
  openai: OpenAI;
}): Promise<Array<{
  messageId: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: number;
  detectedLanguage: string;
  score: number;
}>> {
  try {
    const { chatId, query, limit = 10, openai } = params;
    
    // Generate query embedding
    const queryEmbedding = await generateEmbedding(query, openai);
    
    // Search Pinecone
    const pc = getPinecone();
    const index = pc.index(INDEX_NAME);
    
    const queryResponse = await index.query({
      vector: queryEmbedding,
      topK: limit,
      filter: { chatId: { $eq: chatId } },
      includeMetadata: true,
    });
    
    // Transform results
    const results = queryResponse.matches.map((match: any) => ({
      messageId: match.id,
      text: match.metadata.text || '',
      senderId: match.metadata.senderId || '',
      senderName: match.metadata.senderName || 'Unknown',
      timestamp: match.metadata.timestamp || 0,
      detectedLanguage: match.metadata.detectedLanguage || 'unknown',
      score: match.score || 0,
    }));
    
    console.log(`🔍 Semantic search found ${results.length} results for query: "${query}"`);
    return results;
  } catch (error) {
    console.error('Error searching messages:', error);
    return [];
  }
}

/**
 * Get messages within a date range from Firestore
 */
export async function getMessagesByDateRange(params: {
  chatId: string;
  startDate: Date;
  endDate: Date;
  limit?: number;
}): Promise<any[]> {
  try {
    const { chatId, startDate, endDate, limit = 100 } = params;
    
    // Query Firestore for messages in date range
    const messagesRef = admin.firestore()
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(startDate))
      .where('timestamp', '<=', admin.firestore.Timestamp.fromDate(endDate))
      .orderBy('timestamp', 'desc')
      .limit(limit);
    
    const snapshot = await messagesRef.get();
    
    // Get unique sender IDs
    const senderIds = new Set<string>();
    snapshot.docs.forEach(doc => {
      const senderId = doc.data().senderId;
      if (senderId) senderIds.add(senderId);
    });
    
    // Fetch all sender names
    const senderNames: Record<string, string> = {};
    for (const senderId of Array.from(senderIds)) {
      try {
        const userDoc = await admin.firestore().collection('users').doc(senderId).get();
        if (userDoc.exists) {
          senderNames[senderId] = userDoc.data()?.displayName || 'Unknown';
        } else {
          senderNames[senderId] = 'Unknown';
        }
      } catch (e) {
        senderNames[senderId] = 'Unknown';
      }
    }
    
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      senderName: senderNames[doc.data().senderId] || 'Unknown',
      timestamp: doc.data().timestamp?.toMillis() || 0,
    }));
    
    console.log(`📅 Found ${messages.length} messages between ${startDate.toISOString()} and ${endDate.toISOString()}`);
    return messages;
  } catch (error) {
    console.error('Error getting messages by date range:', error);
    return [];
  }
}

/**
 * Get messages from a specific participant
 */
export async function getMessagesBySender(params: {
  chatId: string;
  senderId: string;
  limit?: number;
}): Promise<any[]> {
  try {
    const { chatId, senderId, limit = 100 } = params;
    
    const messagesRef = admin.firestore()
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .where('senderId', '==', senderId)
      .orderBy('timestamp', 'desc')
      .limit(limit);
    
    const snapshot = await messagesRef.get();
    
    // Get sender name
    let senderName = 'Unknown';
    try {
      const userDoc = await admin.firestore().collection('users').doc(senderId).get();
      if (userDoc.exists) {
        senderName = userDoc.data()?.displayName || 'Unknown';
      }
    } catch (e) {
      console.error('Error fetching sender name:', e);
    }
    
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      senderName,
      timestamp: doc.data().timestamp?.toMillis() || 0,
    }));
    
    console.log(`👤 Found ${messages.length} messages from sender ${senderId}`);
    return messages;
  } catch (error) {
    console.error('Error getting messages by sender:', error);
    return [];
  }
}

/**
 * Get conversation statistics
 */
export async function getChatStatistics(chatId: string): Promise<{
  totalMessages: number;
  languagesUsed: string[];
  participantIds: string[];
  participantNames: Record<string, string>;
  timeSpan: { start: number; end: number };
}> {
  try {
    const messagesRef = admin.firestore()
      .collection('chats')
      .doc(chatId)
      .collection('messages');
    
    const snapshot = await messagesRef.get();
    
    const languagesSet = new Set<string>();
    const participantsSet = new Set<string>();
    const participantNames: Record<string, string> = {};
    let earliestTimestamp = Date.now();
    let latestTimestamp = 0;
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      
      if (data.detectedLanguage) languagesSet.add(data.detectedLanguage);
      if (data.senderId) {
        participantsSet.add(data.senderId);
        // Try to get sender name from cache or user lookup
      }
      
      const timestamp = data.timestamp?.toMillis() || Date.now();
      if (timestamp < earliestTimestamp) earliestTimestamp = timestamp;
      if (timestamp > latestTimestamp) latestTimestamp = timestamp;
    });
    
    // Get participant names
    const participantArray = Array.from(participantsSet);
    for (const userId of participantArray) {
      try {
        const userDoc = await admin.firestore().collection('users').doc(userId).get();
        if (userDoc.exists) {
          participantNames[userId] = userDoc.data()?.displayName || 'Unknown';
        }
      } catch (e) {
        participantNames[userId] = 'Unknown';
      }
    }
    
    console.log(`📊 Chat stats: ${snapshot.size} messages, ${languagesSet.size} languages, ${participantsSet.size} participants`);
    
    return {
      totalMessages: snapshot.size,
      languagesUsed: Array.from(languagesSet),
      participantIds: participantArray,
      participantNames,
      timeSpan: { start: earliestTimestamp, end: latestTimestamp },
    };
  } catch (error) {
    console.error('Error getting chat statistics:', error);
    return {
      totalMessages: 0,
      languagesUsed: [],
      participantIds: [],
      participantNames: {},
      timeSpan: { start: 0, end: 0 },
    };
  }
}

/**
 * Get recent messages for context
 */
export async function getRecentMessages(params: {
  chatId: string;
  limit?: number;
}): Promise<any[]> {
  try {
    const { chatId, limit = 20 } = params;
    
    const messagesRef = admin.firestore()
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .orderBy('timestamp', 'desc')
      .limit(limit);
    
    const snapshot = await messagesRef.get();
    
    // Get unique sender IDs
    const senderIds = new Set<string>();
    snapshot.docs.forEach(doc => {
      const senderId = doc.data().senderId;
      if (senderId) senderIds.add(senderId);
    });
    
    // Fetch all sender names
    const senderNames: Record<string, string> = {};
    for (const senderId of Array.from(senderIds)) {
      try {
        const userDoc = await admin.firestore().collection('users').doc(senderId).get();
        if (userDoc.exists) {
          senderNames[senderId] = userDoc.data()?.displayName || 'Unknown';
        } else {
          senderNames[senderId] = 'Unknown';
        }
      } catch (e) {
        senderNames[senderId] = 'Unknown';
      }
    }
    
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      senderName: senderNames[doc.data().senderId] || 'Unknown',
      timestamp: doc.data().timestamp?.toMillis() || 0,
    }));
    
    console.log(`📝 Retrieved ${messages.length} recent messages`);
    return messages.reverse(); // Return in chronological order
  } catch (error) {
    console.error('Error getting recent messages:', error);
    return [];
  }
}

