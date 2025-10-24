/**
 * Firebase Cloud Functions for AI Features
 * Handles OpenAI and Pinecone operations server-side
 */

// Load environment variables from .env file (for local emulator)
import * as dotenv from 'dotenv';
dotenv.config();

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
  console.log('🚀🚀🚀 summarizeThread CALLED! 🚀🚀🚀');
  console.log('📥 Raw data:', JSON.stringify(data).substring(0, 100));
  console.log('👤 Context auth:', context.auth ? 'HAS AUTH' : 'NO AUTH');
  console.log('👤 Auth UID:', context.auth?.uid || 'none');
  console.log('🔑 OpenAI Key exists:', !!process.env.OPENAI_API_KEY);
  console.log('🔑 OpenAI Key length:', process.env.OPENAI_API_KEY?.length || 0);
  console.log('🌍 Environment:', process.env.NODE_ENV || 'unknown');
  
  // For local development, skip auth check
  const isLocalDev = !process.env.GCLOUD_PROJECT; // Cloud functions have this env var
  
  if (isLocalDev) {
    console.log('🔧 LOCAL DEV MODE - Skipping auth check');
  } else {
    // Auth check (production only)
    if (!context.auth) {
      console.error('❌ Authentication failed - no context.auth');
      throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }
  }

  const { messages, useRAG, previousSummary } = data;

  if (!messages || messages.length === 0) {
    console.error('❌ No messages provided');
    throw new functions.https.HttpsError('invalid-argument', 'Messages array is required');
  }

  console.log(`📊 Processing ${messages.length} messages, RAG: ${useRAG}, Has previous: ${!!previousSummary}`);

  try {
    let contextMessages = messages;

    // If RAG enabled, fetch relevant context
    if (useRAG && messages.length > 50) {
      // For very long threads, use RAG to get most relevant messages
      contextMessages = messages.slice(-50); // Last 50 messages for summary
    }

    let prompt = `Analyze this conversation thread and provide:
1. A brief overview (2-3 sentences summarizing the entire conversation)
2. Participant contributions (what each person contributed to the discussion)

Conversation:
${contextMessages.map((m: any) => `${m.senderName}: ${m.text}`).join('\n')}`;

    // If there's a previous summary, build upon it
    if (previousSummary) {
      prompt = `You previously summarized this conversation (which had ${previousSummary.messageCount} messages). Now there are ${messages.length} messages total.

Previous summary:
- Overview: ${previousSummary.summary}
- Participant contributions: ${JSON.stringify(previousSummary.participantContributions)}

New messages since last summary:
${contextMessages.slice(previousSummary.messageCount).map((m: any) => `${m.senderName}: ${m.text}`).join('\n')}

Update the summary to incorporate the new messages. Keep the previous context but highlight what's new.`;
    }

    prompt += `\n\nFormat your response as JSON with keys: 
- summary (string): brief 2-3 sentence overview
- participantContributions (array): [{userName: string, mainPoints: string[]}]`;

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

  const { messages, previousItems } = data;

  if (!messages || messages.length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Messages array is required');
  }

  try {
    // Get current date for context
    const now = new Date();
    const dateContext = `Today is ${now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.`;
    
    let prompt = `${dateContext}

Extract action items from this conversation. For each action item:
- The task description
- Who it's assigned to (if mentioned)
- Due date: Convert relative dates like "by Friday", "next Monday", "by end of week" to actual ISO dates. Use the current date context above.
- Priority (high/medium/low)
- Context from the message

Conversation with timestamps:
${messages.map((m: any) => `[${m.timestamp}] ${m.senderName}: ${m.text}`).join('\n')}`;

    // If there are previous items, build upon them
    if (previousItems && previousItems.length > 0) {
      prompt = `${dateContext}

You previously extracted these action items from this conversation:

${previousItems.map((item: any, idx: number) => 
  `${idx + 1}. ${item.task} (assigned to: ${item.assignedToName || 'unassigned'}, due: ${item.dueDate || 'no date'}, priority: ${item.priority})`
).join('\n')}

Now analyze the full conversation again to:
1. Keep existing action items that are still relevant
2. Add any NEW action items from the conversation
3. Update due dates if there's new information
4. Convert relative dates to actual ISO dates using today's date

Full conversation with timestamps:
${messages.map((m: any) => `[${m.timestamp}] ${m.senderName}: ${m.text}`).join('\n')}`;
    }

    prompt += `\n\nReturn JSON array of action items with keys: 
- task (string)
- assignedToName (string or null)
- dueDate (ISO date string or null) - IMPORTANT: Convert phrases like "by Friday", "next Monday", "by end of week" to actual ISO date strings
- priority (string: high/medium/low)
- context (string)
- sourceMessageId (string)`;

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

  const { messages, previousDecisions } = data;

  if (!messages || messages.length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Messages array is required');
  }

  try {
    let prompt = `Identify decisions and agreements from this conversation. For each decision:
- What was decided
- Who agreed (array of names)
- Context (why this decision was made, what it relates to)
- Source message IDs

Conversation:
${messages.map((m: any) => `${m.id} - ${m.senderName}: ${m.text}`).join('\n')}`;

    // If there are previous decisions, build upon them
    if (previousDecisions && previousDecisions.length > 0) {
      prompt = `You previously tracked these decisions from this conversation:

${previousDecisions.map((dec: any, idx: number) => 
  `${idx + 1}. ${dec.decision} (agreed by: ${dec.agreedByNames.join(', ')})`
).join('\n')}

Now analyze the full conversation again to:
1. Keep existing decisions that are still relevant
2. Add any NEW decisions or agreements
3. Update context if there's additional information about existing decisions

Full conversation:
${messages.map((m: any) => `${m.id} - ${m.senderName}: ${m.text}`).join('\n')}`;
    }

    prompt += `\n\nReturn JSON array with keys: 
- decision (string): what was decided
- agreedByNames (string[]): who agreed
- context (string): why/what this relates to
- sourceMessageIds (string[]): message IDs where decision was made`;

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

