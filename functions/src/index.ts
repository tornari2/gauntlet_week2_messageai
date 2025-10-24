/**
 * Firebase Cloud Functions for AI Features
 * Handles OpenAI and Pinecone operations server-side
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import OpenAI from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';

// Initialize Firebase Admin
admin.initializeApp();

const PINECONE_INDEX_NAME = 'messageai-messages';

// Lazy initialize OpenAI (only when actually called)
function getOpenAI() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// Lazy initialize Pinecone (only when actually called)
function getPinecone() {
  return new Pinecone({
    apiKey: process.env.PINECONE_API_KEY || '',
  });
}

// Helper: Clean JSON response from OpenAI (removes markdown formatting)
function cleanJSONResponse(content: string): string {
  // Remove markdown code blocks if present
  let cleaned = content.trim();
  if (cleaned.startsWith('```')) {
    // Remove opening ```json or ```
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
    // Remove closing ```
    cleaned = cleaned.replace(/\s*```\s*$/, '');
  }
  return cleaned.trim();
}

/**
 * 1. Thread Summarization
 * Generates AI summary of a conversation thread
 */
export const summarizeThread = functions.https.onCall(async (data, context) => {
  // Auth check
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const { messages, useRAG } = data;

  if (!messages || messages.length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Messages array is required');
  }

  try {
    let contextMessages = messages;

    // If RAG enabled, fetch relevant context
    if (useRAG && messages.length > 50) {
      // For very long threads, use RAG to get most relevant messages
      contextMessages = messages.slice(-50); // Last 50 messages for summary
    }

    const prompt = `Analyze this conversation thread and provide:
1. A 2-3 sentence overview
2. Main topics discussed (3-5 topics)
3. Key points or decisions (bullet points)
4. Participant contributions summary

Conversation:
${contextMessages.map((m: any) => `${m.senderName}: ${m.text}`).join('\n')}

Format your response as JSON with keys: summary, mainTopics (array), keyPoints (array), participantContributions (array of {userName, mainPoints})`;

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    const content = response.choices[0].message.content || '{}';
    const cleanedContent = cleanJSONResponse(content);
    const result = JSON.parse(cleanedContent);

    return {
      ...result,
      messageCount: messages.length,
      timestamp: admin.firestore.Timestamp.now(),
    };
  } catch (error) {
    console.error('Error summarizing thread:', error);
    throw new functions.https.HttpsError('internal', 'Failed to summarize thread');
  }
});

/**
 * 2. Action Items Extraction
 * Extracts tasks and assignments from conversation
 */
export const extractActionItems = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const { messages } = data;

  if (!messages || messages.length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Messages array is required');
  }

  try {
    const prompt = `Extract action items from this conversation. For each action item, identify:
- The task description
- Who it's assigned to (if mentioned)
- Due date (if mentioned)
- Priority (high/medium/low)
- Context from the message

Conversation:
${messages.map((m: any) => `${m.senderName}: ${m.text}`).join('\n')}

Return JSON array of action items with keys: task, assignedToName, dueDate, priority, context, sourceMessageId`;

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
    });

    const content = response.choices[0].message.content || '[]';
    const cleanedContent = cleanJSONResponse(content);
    const actionItems = JSON.parse(cleanedContent);

    return {
      actionItems: actionItems.map((item: any) => ({
        ...item,
        id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: 'pending',
        extractedAt: admin.firestore.Timestamp.now(),
      })),
    };
  } catch (error) {
    console.error('Error extracting action items:', error);
    throw new functions.https.HttpsError('internal', 'Failed to extract action items');
  }
});

/**
 * 3. Priority Detection
 * Analyzes message urgency and priority
 */
export const analyzePriority = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const { messageText } = data;

  if (!messageText) {
    throw new functions.https.HttpsError('invalid-argument', 'Message text is required');
  }

  try {
    const prompt = `Analyze the urgency/priority of this message. Return JSON with:
- priority: "urgent" | "high" | "medium" | "low"
- reasons: array of strings explaining why
- confidence: number 0-1

Message: "${messageText}"`;

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 200,
    });

    const content = response.choices[0].message.content || '{}';
    const cleanedContent = cleanJSONResponse(content);
    const result = JSON.parse(cleanedContent);

    return {
      ...result,
      analyzedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error analyzing priority:', error);
    throw new functions.https.HttpsError('internal', 'Failed to analyze priority');
  }
});

/**
 * 4. Decision Tracking
 * Identifies decisions and agreements in conversation
 */
export const trackDecisions = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const { messages } = data;

  if (!messages || messages.length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Messages array is required');
  }

  try {
    const prompt = `Identify decisions and agreements from this conversation. For each decision:
- What was decided
- Who agreed (array of names)
- Context
- Category: "technical" | "business" | "scheduling" | "process" | "other"
- Source message IDs

Conversation:
${messages.map((m: any) => `${m.id} - ${m.senderName}: ${m.text}`).join('\n')}

Return JSON array with keys: decision, agreedByNames, context, category, sourceMessageIds`;

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
    });

    const content = response.choices[0].message.content || '[]';
    const cleanedContent = cleanJSONResponse(content);
    const decisions = JSON.parse(cleanedContent);

    return {
      decisions: decisions.map((item: any) => ({
        ...item,
        id: `decision_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        extractedAt: admin.firestore.Timestamp.now(),
      })),
    };
  } catch (error) {
    console.error('Error tracking decisions:', error);
    throw new functions.https.HttpsError('internal', 'Failed to track decisions');
  }
});

/**
 * 5. Create Embedding (for RAG)
 * Generates vector embedding for a message
 */
export const createEmbedding = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const { messageId, chatId, text, senderId } = data;

  if (!messageId || !text) {
    throw new functions.https.HttpsError('invalid-argument', 'messageId and text are required');
  }

  try {
    // Create embedding using OpenAI
    const embeddingResponse = await getOpenAI().embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });

    const embedding = embeddingResponse.data[0].embedding;

    // Store in Pinecone
    const index = getPinecone().index(PINECONE_INDEX_NAME);
    
    await index.upsert([{
      id: messageId,
      values: embedding,
      metadata: {
        chatId,
        text,
        senderId,
        timestamp: Date.now(),
      },
    }]);

    return {
      success: true,
      messageId,
    };
  } catch (error) {
    console.error('Error creating embedding:', error);
    throw new functions.https.HttpsError('internal', 'Failed to create embedding');
  }
});

/**
 * 6. Smart Search (RAG)
 * Semantic search across messages with AI-generated answer
 */
export const smartSearch = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const { query, chatId, topK = 10 } = data;

  if (!query) {
    throw new functions.https.HttpsError('invalid-argument', 'Query is required');
  }

  try {
    // Create query embedding
    const embeddingResponse = await getOpenAI().embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    });

    const queryEmbedding = embeddingResponse.data[0].embedding;

    // Search Pinecone
    const index = getPinecone().index(PINECONE_INDEX_NAME);
    const searchResults = await index.query({
      vector: queryEmbedding,
      topK,
      filter: chatId ? { chatId: { $eq: chatId } } : undefined,
      includeMetadata: true,
    });

    // Extract search results
    const results = searchResults.matches.map((match: any) => ({
      messageId: match.id,
      text: match.metadata?.text || '',
      senderId: match.metadata?.senderId || '',
      timestamp: match.metadata?.timestamp || Date.now(),
      relevanceScore: match.score || 0,
      chatId: match.metadata?.chatId || '',
    }));

    // Generate AI answer from context
    if (results.length > 0) {
      const context = results.map((r: any) => r.text).join('\n\n');
      
      const answerPrompt = `Based on these relevant messages, answer the user's question concisely:

Question: ${query}

Relevant messages:
${context}

Provide a helpful 2-3 sentence answer.`;

      const answerResponse = await getOpenAI().chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: answerPrompt }],
        temperature: 0.7,
        max_tokens: 200,
      });

      const answer = answerResponse.choices[0].message.content || '';

      return {
        query,
        results,
        answer,
        totalResults: results.length,
        searchedAt: new Date().toISOString(),
      };
    }

    return {
      query,
      results: [],
      answer: 'No relevant messages found.',
      totalResults: 0,
      searchedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error in smart search:', error);
    throw new functions.https.HttpsError('internal', 'Failed to perform smart search');
  }
});

