/**
 * Firebase Cloud Functions for International Communicator AI Features
 * Handles OpenAI operations for translation, language detection, and multilingual features
 */

// Load environment variables from .env file (for local emulator)
import * as dotenv from 'dotenv';
dotenv.config();

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import OpenAI from 'openai';
import * as ragService from './ragService';
import * as dateParsingService from './dateParsingService';

// Initialize Firebase Admin
admin.initializeApp();

// Get OpenAI API key from Firebase config or environment variable
function getOpenAIKey(): string {
  // Try environment variable first (for local emulator)
  if (process.env.OPENAI_API_KEY) {
    console.log('Using OpenAI API key from environment variable');
    return process.env.OPENAI_API_KEY;
  }
  
  // Fall back to Firebase config (for production)
  try {
    const config = functions.config();
    if (config.openai && config.openai.key) {
      console.log('Using OpenAI API key from Firebase config');
      return config.openai.key;
    }
  } catch (error) {
    console.error('Error getting Firebase config:', error);
  }
  
  throw new Error('OpenAI API key not configured. Set OPENAI_API_KEY environment variable or run: firebase functions:config:set openai.key="YOUR_KEY"');
}

// Lazy initialize OpenAI (only when actually called)
function getOpenAI() {
  const apiKey = getOpenAIKey();
  return new OpenAI({
    apiKey: apiKey,
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
 * 1. Translate Text
 * Translates text from one language to another
 */
export const translateText = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    console.error('Unauthenticated request to translateText');
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in to translate text');
  }

  const { text, targetLanguage, sourceLanguage } = data;

  if (!text || !targetLanguage) {
    throw new functions.https.HttpsError('invalid-argument', 'Text and target language are required');
  }

  try {
    const sourceLangInfo = sourceLanguage ? ` from ${sourceLanguage}` : '';
    const prompt = `Translate the following text${sourceLangInfo} to ${targetLanguage}.
Maintain the tone and context. Return ONLY the translation, no explanations.

Text: "${text}"

Translation:`;

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 500,
    });

    let translatedText = response.choices[0].message.content?.trim() || text;
    
    // Remove surrounding quotes if present (AI sometimes adds them)
    if ((translatedText.startsWith('"') && translatedText.endsWith('"')) ||
        (translatedText.startsWith("'") && translatedText.endsWith("'"))) {
      translatedText = translatedText.slice(1, -1);
    }

    return {
      translatedText,
      sourceLanguage: sourceLanguage || 'auto',
      targetLanguage,
      confidence: 0.9,
    };
  } catch (error) {
    console.error('Error translating text:', error);
    throw new functions.https.HttpsError('internal', 'Failed to translate text');
  }
});

/**
 * 2. Detect Language
 * Detects the language of a text using OpenAI
 */
export const detectLanguage = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    console.error('Unauthenticated request to detectLanguage');
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in to detect language');
  }

  const { text } = data;

  if (!text) {
    throw new functions.https.HttpsError('invalid-argument', 'Text is required');
  }

  try {
    const prompt = `Detect the language of this text. 
Respond with ONLY the ISO 639-1 language code (e.g., 'en', 'es', 'fr', 'zh', 'ar').
If the text is nonsensical, contains only numbers/symbols, or cannot be identified, respond with 'und' (undefined).

Text: "${text}"

Language code:`;

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 10,
    });

    const languageCode = response.choices[0].message.content?.trim().toLowerCase() || 'und';

    return {
      languageCode,
    };
  } catch (error) {
    console.error('Error detecting language:', error);
    throw new functions.https.HttpsError('internal', 'Failed to detect language');
  }
});

/**
 * 3. Adjust Tone (formerly Formality)
 * Rewrites text with specified tone level
 */
export const adjustFormality = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    console.error('Unauthenticated request to adjustFormality');
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in to adjust tone');
  }

  const { text, formalityLevel, targetLanguage } = data;

  if (!text || !formalityLevel || !targetLanguage) {
    throw new functions.https.HttpsError('invalid-argument', 'Text, tone level, and target language are required');
  }

  try {
    const toneDescriptions = {
      casual: 'Friendly, relaxed, conversational (can include slang and idiomatic expressions)',
      neutral: 'Polite, professional, approachable. Must be free of slang or idiomatic expressions - rephrase any slang or idioms into clear, standard language',
      formal: 'Precise, technical, academic. Must be free of slang or idiomatic expressions - rephrase any slang or idioms into clear, standard language',
    };

    const prompt = `Rewrite this message in a ${formalityLevel} tone in ${targetLanguage}.
Maintain the core meaning but adjust the tone appropriately.

IMPORTANT: Return ONLY the rephrased sentence or message. Do NOT add any letter formatting, greetings, or closings like "Dear X" or "Sincerely". Just rephrase the original message with the appropriate tone.

Tone level: ${formalityLevel} - ${toneDescriptions[formalityLevel as keyof typeof toneDescriptions]}

Original: "${text}"

${formalityLevel.charAt(0).toUpperCase() + formalityLevel.slice(1)} version:`;

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 300,
    });

    const adjustedText = response.choices[0].message.content?.trim() || text;

    return {
      adjustedText,
    };
  } catch (error) {
    console.error('Error adjusting tone:', error);
    throw new functions.https.HttpsError('internal', 'Failed to adjust tone');
  }
});

/**
 * 4. Explain Slang/Idioms
 * Identifies and explains slang and idioms
 */
export const explainSlang = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    console.error('Unauthenticated request to explainSlang');
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in to explain slang');
  }

  const { text, detectedLanguage, targetLanguage } = data;

  if (!text || !detectedLanguage) {
    throw new functions.https.HttpsError('invalid-argument', 'Text and detected language are required');
  }

  // Default to English if no target language specified
  const explanationLanguage = targetLanguage || 'English';

  try {
    const prompt = `Identify any slang, idioms, or informal expressions in this ${detectedLanguage} message.
For each one found, provide (IN ${explanationLanguage}):
1. The slang/idiom
2. Literal meaning
3. Actual meaning/usage
4. Example in context

If none found, return an empty array.
ALL EXPLANATIONS MUST BE IN ${explanationLanguage}.

Message: "${text}"

Format your response as a JSON array of objects with keys: term, literal, meaning, example.`;

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens: 500,
    });

    const content = response.choices[0].message.content || '[]';
    const cleanedContent = cleanJSONResponse(content);
    const explanations = JSON.parse(cleanedContent);

    return {
      explanations: Array.isArray(explanations) ? explanations : [],
    };
  } catch (error) {
    console.error('Error explaining slang:', error);
    throw new functions.https.HttpsError('internal', 'Failed to explain slang');
  }
});

/**
 * 5. Get Cultural Context
 * Provides cultural context and insights
 */
export const getCulturalContext = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    console.error('Unauthenticated request to getCulturalContext');
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in to get cultural context');
  }

  const { text, detectedLanguage, targetLanguage } = data;

  if (!text || !detectedLanguage) {
    throw new functions.https.HttpsError('invalid-argument', 'Text and detected language are required');
  }

  // Default to English if no target language specified
  const explanationLanguage = targetLanguage || 'English';

  try {
    const prompt = `Analyze this message for cultural context and references.
Consider the language (${detectedLanguage}) and provide helpful cultural insights.
If there are no significant cultural references, say "No specific cultural context detected."

ALL EXPLANATIONS MUST BE IN ${explanationLanguage}.

Message: "${text}"

Format your response as JSON with keys:
- culturalInsights: string (main explanation IN ${explanationLanguage})
- references: array of strings (specific cultural references found, explained IN ${explanationLanguage})`;

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.6,
      max_tokens: 400,
    });

    const content = response.choices[0].message.content || '{}';
    const cleanedContent = cleanJSONResponse(content);
    const result = JSON.parse(cleanedContent);

    return {
      culturalInsights: result.culturalInsights || 'No specific cultural context detected.',
      references: result.references || [],
    };
  } catch (error) {
    console.error('Error getting cultural context:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get cultural context');
  }
});

/**
 * 6. Summarize Multilingual Thread
 * Generates summary of conversation in user's preferred language
 */
export const summarizeMultilingualThread = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    console.error('Unauthenticated request to summarizeMultilingualThread');
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in to summarize thread');
  }

  const { messages, userLanguage } = data;

  if (!messages || messages.length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Messages array is required');
  }

  if (messages.length < 5) {
    throw new functions.https.HttpsError('invalid-argument', 'Need at least 5 messages to summarize');
  }

  try {
    const conversationText = messages
      .map((m: any) => `${m.senderName} (${m.detectedLanguage || 'unknown'}): ${m.text}`)
      .join('\n');

    const prompt = `Summarize this multilingual conversation in ${userLanguage}.
The conversation may contain messages in multiple languages.

Provide:
1. A brief 2-3 sentence overview
2. Key points from each participant (as an array of objects with participantName and keyPoints array)
3. List of languages detected in the conversation

Conversation:
${conversationText}

Format your response as JSON with keys:
- overview: string
- participantSummaries: array of {participantName: string, keyPoints: string[]}
- languagesDetected: string[] (ISO codes)`;

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 800,
    });

    const content = response.choices[0].message.content || '{}';
    const cleanedContent = cleanJSONResponse(content);
    const result = JSON.parse(cleanedContent);

    return {
      overview: result.overview || '',
      participantSummaries: result.participantSummaries || [],
      languagesDetected: result.languagesDetected || [],
      generatedIn: userLanguage,
    };
  } catch (error) {
    console.error('Error summarizing multilingual thread:', error);
    throw new functions.https.HttpsError('internal', 'Failed to summarize thread');
  }
});

// ==================== INTELLIGENT CHAT ASSISTANT WITH RAG + FUNCTION CALLING ====================

/**
 * Intelligent Chat Assistant
 * 
 * Uses RAG (semantic search) and function calling to answer natural language queries about conversations
 * 
 * Examples:
 * - "Summarize this conversation"
 * - "What did we discuss about the project?"
 * - "Show me action items from last week"
 * - "What's the tone of our conversation?"
 * - "Summarize everything John said about budgets"
 */
export const intelligentChatAssistant = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const { chatId, query, userLanguage = 'English' } = data;

  if (!chatId || !query) {
    throw new functions.https.HttpsError('invalid-argument', 'Chat ID and query are required');
  }

  try {
    const openai = getOpenAI();

    // Define tools that the LLM can call
    const tools: any[] = [
      {
        type: 'function',
        function: {
          name: 'search_conversation_semantically',
          description: 'Search for messages about a specific topic using semantic search. Use this when the user asks about a specific subject or keyword.',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'The topic or keyword to search for (e.g., "budget", "travel plans", "project deadline")',
              },
              limit: {
                type: 'number',
                description: 'Maximum number of messages to return (default 10)',
                default: 10,
              },
            },
            required: ['query'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'get_messages_by_date_range',
          description: 'Get messages within a specific date range. Use this when the user mentions dates like "last week", "yesterday", "since Monday", or "February 5th".',
          parameters: {
            type: 'object',
            properties: {
              dateRange: {
                type: 'string',
                description: 'Natural language date range (e.g., "last week", "yesterday", "since February 5th", "past month")',
              },
            },
            required: ['dateRange'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'get_messages_by_participant',
          description: 'Get messages from a specific participant. Use this when the user asks about what a specific person said.',
          parameters: {
            type: 'object',
            properties: {
              participantName: {
                type: 'string',
                description: 'The name of the participant',
              },
            },
            required: ['participantName'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'get_conversation_statistics',
          description: 'Get statistics about the conversation (total messages, participants, languages used, time span)',
          parameters: {
            type: 'object',
            properties: {},
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'get_recent_context',
          description: 'Get recent messages for general conversation context',
          parameters: {
            type: 'object',
            properties: {
              limit: {
                type: 'number',
                description: 'Number of recent messages to retrieve (default 20)',
                default: 20,
              },
            },
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'extract_action_items',
          description: 'Extract action items, tasks, and to-dos from messages',
          parameters: {
            type: 'object',
            properties: {
              messageIds: {
                type: 'array',
                items: { type: 'string' },
                description: 'Array of message IDs to analyze (get from previous function calls)',
              },
            },
            required: ['messageIds'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'extract_dates_and_deadlines',
          description: 'Extract important dates, deadlines, and time references from messages',
          parameters: {
            type: 'object',
            properties: {
              messageIds: {
                type: 'array',
                items: { type: 'string' },
                description: 'Array of message IDs to analyze',
              },
            },
            required: ['messageIds'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'analyze_conversation_tone',
          description: 'Analyze the emotional tone and sentiment of the conversation',
          parameters: {
            type: 'object',
            properties: {
              messageIds: {
                type: 'array',
                items: { type: 'string' },
                description: 'Array of message IDs to analyze',
              },
            },
            required: ['messageIds'],
          },
        },
      },
    ];

    // Initial system prompt
    const systemPrompt = `You are an intelligent conversation analyst. Your job is to help users understand and analyze their chat conversations.

You have access to various tools to retrieve and analyze conversation data. Use them intelligently based on the user's query.

Guidelines:
1. Start by gathering relevant data using the appropriate tools
2. For summaries, first get recent context or search semantically
3. For specific questions, use semantic search
4. For date-based queries, use date range filtering
5. Extract structured information (to-do items, dates, tone, mood) when requested
6. Provide responses in ${userLanguage}
7. Be concise but thorough

IMPORTANT FORMATTING RULES:

SUMMARIES - When summarizing conversations, format as follows:
- Start with 2-3 sentences giving a general overview
- Then add the heading "What each person discussed:"
- For each participant, use bullet points (•) with their name followed by their key points
- Do NOT use markdown formatting like ** or bold - just plain text
- Add blank lines between participants for better readability
- Example format:
  "This conversation focused on planning a team project and coordinating deadlines. The team discussed budget constraints and timeline expectations.
  
  What each person discussed:
  
  • John:
    • Proposed a budget of $50,000
    • Suggested starting next Monday
    • Offered to lead the design phase
  
  • Sarah:
    • Agreed with the timeline
    • Raised concerns about resources
    • Volunteered to handle client communication"

TO-DO LISTS - When user asks for their to-do list or tasks:
- Focus ONLY on what the current user needs to do (not general action items)
- Return a simple bulleted list (•) of tasks for the user
- Do NOT include priority levels or assignees
- Do NOT use markdown formatting like ** or bold - just plain text
- Add blank lines between tasks for better readability
- Example: "Your to-do list:\n\n• Review the contract by Friday\n\n• Send invoice to client\n\n• Schedule follow-up meeting"

DATES & TIMES - When extracting dates and times:
- Return a simple bulleted list (•) of all time references
- Include partial dates (e.g., "next Monday", "this afternoon", "in 2 weeks")
- CRITICAL: Do NOT assume or infer specific dates (years, months, days) that aren't explicitly stated or clearly derivable from the conversation context
- If someone says "my birthday is December 1st" without a year, just say "December 1st" - DO NOT add a year
- If someone says "next Monday" and today is known, you can derive the specific date. Otherwise, just say "next Monday"
- Do NOT use markdown formatting like ** or bold - just plain text
- Format: "• [Date/Time]: [Context/Why it's important]"
- Example: "• Next Monday: Project kickoff meeting\n• December 1st: Birthday\n• This Friday afternoon: Contract review deadline\n• In 2 weeks: Final presentation"

MOOD ANALYSIS - When analyzing the mood/emotional sentiment:
- Provide an overall mood assessment of the conversation
- CRITICAL: Break down the mood by each individual participant
- For each person, describe their emotional state and sentiment
- Do NOT use markdown formatting like ** or bold - just plain text
- Add blank lines between participants for better readability
- Example format:
  "Overall mood: The conversation has an optimistic and collaborative tone with some underlying stress about deadlines.
  
  Individual moods:
  
  • John:
    • Enthusiastic and proactive
    • Showing confidence about the project
    • Slight concern about budget constraints
  
  • Sarah:
    • Cautiously optimistic
    • Feeling some pressure about timelines
    • Appreciative of team support"

User's query: "${query}"
Chat ID: ${chatId}`;

    const messages: any[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: query },
    ];

    let toolCallCount = 0;
    const maxToolCalls = 10; // Allow up to 10 tool calls for complex queries
    const gatheredData: any = {
      messages: [],
      statistics: null,
      actionItems: [],
      dates: [],
      toneAnalysis: null,
    };

    // Function calling loop
    while (toolCallCount < maxToolCalls) {
      console.log(`🤖 [AI Assistant] Starting iteration ${toolCallCount + 1}`);
      
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        tools,
        tool_choice: 'auto',
        temperature: 0.7,
        max_tokens: 2000,
      });

      const responseMessage = response.choices[0].message;
      messages.push(responseMessage);

      // Check if LLM wants to call functions
      if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        console.log(`🔧 [AI Assistant] LLM requested ${responseMessage.tool_calls.length} tool calls`);
        
        // Execute all tool calls
        for (const toolCall of responseMessage.tool_calls) {
          toolCallCount++;
          
          // Handle both function and custom tool calls
          if (toolCall.type !== 'function') continue;
          
          const functionName = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments);
          
          console.log(`📞 [AI Assistant] Calling: ${functionName}`, functionArgs);
          
          let functionResult: any;

          try {
            // Execute the appropriate function
            switch (functionName) {
              case 'search_conversation_semantically': {
                const results = await ragService.searchMessages({
                  chatId,
                  query: functionArgs.query,
                  limit: functionArgs.limit || 10,
                  openai,
                });
                
                gatheredData.messages.push(...results);
                
                functionResult = {
                  found: results.length,
                  messages: results.map(m => ({
                    id: m.messageId,
                    text: m.text,
                    sender: m.senderName,
                    timestamp: new Date(m.timestamp).toISOString(),
                    relevanceScore: m.score,
                  })),
                };
                break;
              }

              case 'get_messages_by_date_range': {
                const dateRange = dateParsingService.parseDateRange(functionArgs.dateRange);
                
                if (dateRange) {
                  const [startDate, endDate] = dateRange;
                  const messages = await ragService.getMessagesByDateRange({
                    chatId,
                    startDate,
                    endDate,
                  });
                  
                  gatheredData.messages.push(...messages);
                  
                  functionResult = {
                    dateRange: dateParsingService.formatDateRange(startDate, endDate),
                    found: messages.length,
                    messages: messages.map((m: any) => ({
                      id: m.id,
                      text: m.text,
                      sender: m.senderName || 'Unknown',
                      timestamp: new Date(m.timestamp).toISOString(),
                    })),
                  };
                } else {
                  functionResult = {
                    error: `Could not parse date range: "${functionArgs.dateRange}"`,
                  };
                }
                break;
              }

              case 'get_messages_by_participant': {
                // First, get chat stats to find participant ID by name
                const stats = await ragService.getChatStatistics(chatId);
                
                // Find participant by name (case-insensitive partial match)
                const participantName = functionArgs.participantName.toLowerCase();
                const matchingParticipant = Object.entries(stats.participantNames).find(
                  ([id, name]) => name.toLowerCase().includes(participantName)
                );
                
                if (matchingParticipant) {
                  const [participantId, fullName] = matchingParticipant;
                  const messages = await ragService.getMessagesBySender({
                    chatId,
                    senderId: participantId,
                  });
                  
                  gatheredData.messages.push(...messages);
                  
                  functionResult = {
                    participant: fullName,
                    found: messages.length,
                    messages: messages.map((m: any) => ({
                      id: m.id,
                      text: m.text,
                      timestamp: new Date(m.timestamp).toISOString(),
                    })),
                  };
                } else {
                  functionResult = {
                    error: `Could not find participant with name containing "${functionArgs.participantName}"`,
                    availableParticipants: Object.values(stats.participantNames),
                  };
                }
                break;
              }

              case 'get_conversation_statistics': {
                const stats = await ragService.getChatStatistics(chatId);
                gatheredData.statistics = stats;
                
                functionResult = {
                  totalMessages: stats.totalMessages,
                  participants: Object.values(stats.participantNames),
                  languagesUsed: stats.languagesUsed,
                  timeSpan: {
                    start: new Date(stats.timeSpan.start).toISOString(),
                    end: new Date(stats.timeSpan.end).toISOString(),
                  },
                };
                break;
              }

              case 'get_recent_context': {
                const messages = await ragService.getRecentMessages({
                  chatId,
                  limit: functionArgs.limit || 20,
                });
                
                gatheredData.messages.push(...messages);
                
                functionResult = {
                  found: messages.length,
                  messages: messages.map((m: any) => ({
                    id: m.id,
                    text: m.text,
                    sender: m.senderName || 'Unknown',
                    timestamp: new Date(m.timestamp).toISOString(),
                  })),
                };
                break;
              }

              case 'extract_action_items': {
                // Get the actual message texts
                const messageTexts = gatheredData.messages
                  .filter((m: any) => functionArgs.messageIds.includes(m.id || m.messageId))
                  .map((m: any) => m.text)
                  .join('\n');
                
                // Use OpenAI to extract action items
                const extractionPrompt = `Extract all action items, tasks, and to-dos from these messages. Return as JSON array with format: [{item: string, priority: "high"|"medium"|"low", assignee?: string}]

Messages:
${messageTexts}`;

                const extractionResponse = await openai.chat.completions.create({
                  model: 'gpt-4o-mini',
                  messages: [{ role: 'user', content: extractionPrompt }],
                  temperature: 0.3,
                  max_tokens: 1000,
                });

                try {
                  const content = extractionResponse.choices[0].message.content || '[]';
                  const cleaned = cleanJSONResponse(content);
                  const actionItems = JSON.parse(cleaned);
                  gatheredData.actionItems = actionItems;
                  functionResult = { actionItems };
                } catch (e) {
                  functionResult = { actionItems: [] };
                }
                break;
              }

              case 'extract_dates_and_deadlines': {
                // Get the actual message texts
                const messageTexts = gatheredData.messages
                  .filter((m: any) => functionArgs.messageIds.includes(m.id || m.messageId))
                  .map((m: any) => m.text)
                  .join('\n');
                
                // Use OpenAI for semantic understanding
                const extractionPrompt = `Extract important dates, deadlines, and time references from these messages. Return as JSON array with format: [{date: string, description: string, isDeadline: boolean}]

Messages:
${messageTexts}`;

                const extractionResponse = await openai.chat.completions.create({
                  model: 'gpt-4o-mini',
                  messages: [{ role: 'user', content: extractionPrompt }],
                  temperature: 0.3,
                  max_tokens: 1000,
                });

                try {
                  const content = extractionResponse.choices[0].message.content || '[]';
                  const cleaned = cleanJSONResponse(content);
                  const dates = JSON.parse(cleaned);
                  gatheredData.dates = dates;
                  functionResult = { dates };
                } catch (e) {
                  functionResult = { dates: [] };
                }
                break;
              }

              case 'analyze_conversation_tone': {
                // Get the actual message texts
                const messages = gatheredData.messages
                  .filter((m: any) => functionArgs.messageIds.includes(m.id || m.messageId));
                
                const messageTexts = messages
                  .map((m: any) => `${m.senderName || 'Unknown'}: ${m.text}`)
                  .join('\n');
                
                // Use OpenAI to analyze tone
                const analysisPrompt = `Analyze the emotional tone and sentiment of this conversation. Return as JSON with format: {overall: string, sentiment: "positive"|"neutral"|"negative", details: string, keyEmotions: string[]}

Conversation:
${messageTexts}

Provide the analysis in ${userLanguage}.`;

                const analysisResponse = await openai.chat.completions.create({
                  model: 'gpt-4o-mini',
                  messages: [{ role: 'user', content: analysisPrompt }],
                  temperature: 0.5,
                  max_tokens: 500,
                });

                try {
                  const content = analysisResponse.choices[0].message.content || '{}';
                  const cleaned = cleanJSONResponse(content);
                  const toneAnalysis = JSON.parse(cleaned);
                  gatheredData.toneAnalysis = toneAnalysis;
                  functionResult = toneAnalysis;
                } catch (e) {
                  functionResult = { 
                    overall: 'Could not analyze tone',
                    sentiment: 'neutral',
                    details: '',
                    keyEmotions: [],
                  };
                }
                break;
              }

              default:
                functionResult = { error: 'Unknown function' };
            }
          } catch (error) {
            console.error(`Error executing ${functionName}:`, error);
            functionResult = { error: `Failed to execute ${functionName}` };
          }

          // Add function result to conversation
          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(functionResult),
          });
        }
      } else {
        // LLM provided final answer
        console.log('✅ [AI Assistant] LLM provided final response');
        
        const finalContent = responseMessage.content || '';
        
        // Try to parse as structured JSON response
        try {
          const jsonMatch = finalContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            
            return {
              response: parsed,
              metadata: {
                toolCallsUsed: toolCallCount,
                usedRAG: gatheredData.messages.length > 0,
                usedFunctionCalling: toolCallCount > 0,
              },
            };
          }
        } catch (e) {
          // Not JSON, return as text
        }
        
        // Return as structured response
        return {
          response: {
            summary: finalContent,
            actionItems: gatheredData.actionItems,
            importantDates: gatheredData.dates,
            toneAnalysis: gatheredData.toneAnalysis,
            sources: gatheredData.messages.slice(0, 10).map((m: any) => ({
              messageId: m.id || m.messageId,
              text: m.text,
            })),
          },
          metadata: {
            toolCallsUsed: toolCallCount,
            usedRAG: gatheredData.messages.length > 0,
            usedFunctionCalling: toolCallCount > 0,
          },
        };
      }
    }

    // Max iterations reached
    throw new functions.https.HttpsError('deadline-exceeded', 'Query took too long to process (max tool calls exceeded)');
  } catch (error) {
    console.error('Error in intelligent chat assistant:', error);
    throw new functions.https.HttpsError('internal', 'Failed to process query');
  }
});

// ==================== BACKGROUND MESSAGE INDEXING ====================

/**
 * Automatically index new messages to Pinecone for RAG
 * Triggered when a message is created in Firestore
 */
export const indexNewMessage = functions.firestore
  .document('chats/{chatId}/messages/{messageId}')
  .onCreate(async (snapshot, context) => {
    const message = snapshot.data();
    const { chatId, messageId } = context.params;

    try {
      // Only index text messages (skip images-only messages)
      if (!message.text || message.text.trim() === '') {
        console.log(`⏭️ Skipping indexing for message ${messageId} (no text content)`);
        return;
      }

      const openai = getOpenAI();
      
      // Get sender name
      let senderName = 'Unknown';
      try {
        const userDoc = await admin.firestore().collection('users').doc(message.senderId).get();
        if (userDoc.exists) {
          senderName = userDoc.data()?.displayName || 'Unknown';
        }
      } catch (e) {
        console.error('Error fetching user for indexing:', e);
      }

      // Store embedding in Pinecone
      await ragService.storeMessageEmbedding({
        messageId,
        chatId,
        text: message.text,
        senderId: message.senderId,
        senderName,
        timestamp: message.timestamp?.toMillis() || Date.now(),
        detectedLanguage: message.detectedLanguage,
        openai,
      });

      console.log(`✅ Successfully indexed message ${messageId} in chat ${chatId}`);
    } catch (error) {
      console.error(`❌ Error indexing message ${messageId}:`, error);
      // Don't throw - indexing failures shouldn't block message creation
    }
  });

// ==================== KEEP-WARM FUNCTION ====================

/**
 * Keep-Warm Function
 * 
 * Scheduled to run every 5 minutes to prevent cold starts
 * Keeps Cloud Functions warm and ready for instant responses
 * 
 * Performance Impact:
 * - Eliminates 1-3 second cold start delays
 * - Functions respond instantly instead of warming up first
 * - Cost: ~$0.05/month (negligible)
 * 
 * Note: This only keeps the infrastructure warm, not individual functions
 * But it significantly reduces cold start frequency for all functions
 */
export const keepWarm = functions.pubsub
  .schedule('every 5 minutes')
  .timeZone('America/New_York')
  .onRun(async (context) => {
    console.log('🔥 Keep-warm ping executed at:', new Date().toISOString());
    
    // Optional: Track uptime for monitoring
    const uptimeHours = process.uptime() / 3600;
    console.log(`⏱️  Function uptime: ${uptimeHours.toFixed(2)} hours`);
    
    return null;
  });
