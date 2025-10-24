/**
 * AI Service
 * Core AI functionality using OpenAI GPT-4o-mini
 * Handles summarization, action items, priority detection, and decision tracking
 */

import OpenAI from 'openai';
import { Message, User } from '../types';
import {
  ThreadSummary,
  ActionItem,
  PriorityAnalysis,
  Decision,
  AIServiceError,
  MessagePriority,
} from '../types/ai';
import { AI_CONFIG, OPENAI_CONFIG, PERFORMANCE_CONFIG } from '../config/aiConfig';

/**
 * Initialize OpenAI client
 */
const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Required for React Native/Expo
});

/**
 * Helper: Format messages for LLM prompts
 */
function formatMessagesForPrompt(messages: Message[], users: Record<string, User>): string {
  return messages
    .map((msg) => {
      const user = users[msg.senderId];
      const userName = user?.displayName || 'Unknown User';
      const timestamp = msg.timestamp instanceof Date 
        ? msg.timestamp.toLocaleString() 
        : msg.timestamp.toDate().toLocaleString();
      return `[${timestamp}] ${userName}: ${msg.text}`;
    })
    .join('\n');
}

/**
 * Helper: Retry with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = PERFORMANCE_CONFIG.retryAttempts
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on invalid input or auth errors
      if (error instanceof OpenAI.AuthenticationError) {
        throw new AIServiceError(
          'Invalid OpenAI API key',
          'api_error',
          error
        );
      }
      
      // Wait before retrying
      if (attempt < maxRetries - 1) {
        const delay = PERFORMANCE_CONFIG.retryDelay * Math.pow(2, attempt);
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
 * Helper: Get relevant messages (with optional RAG)
 */
async function getRelevantMessages(
  chatId: string,
  options: {
    useRAG?: boolean;
    query?: string;
    topK?: number;
    allMessages?: Message[];
  }
): Promise<Message[]> {
  if (options.useRAG && options.query) {
    // RAG path: Use vector search
    try {
      // Dynamically import ragService to avoid circular dependency
      const { ragService } = await import('./ragService');
      return await ragService.retrieveRelevantMessages(
        options.query,
        chatId,
        { topK: options.topK || 20 }
      );
    } catch (error) {
      console.warn('RAG retrieval failed, falling back to all messages:', error);
      // Fallback to all messages if RAG fails
    }
  }
  
  // Direct path: Use provided messages or get recent ones
  if (options.allMessages) {
    return options.allMessages;
  }
  
  // This should be replaced with actual message fetching from store
  return [];
}

/**
 * FEATURE 1: Thread Summarization
 * Generates concise summaries of chat conversations
 */
export async function summarizeThread(
  chatId: string,
  messages: Message[],
  users: Record<string, User>,
  useRAG: boolean = AI_CONFIG.summarization.useRAG
): Promise<ThreadSummary> {
  try {
    // Validate input
    if (messages.length < 5) {
      throw new AIServiceError(
        'Need at least 5 messages for meaningful summary',
        'invalid_input'
      );
    }
    
    // Get relevant messages (with optional RAG)
    const relevantMessages = await getRelevantMessages(chatId, {
      useRAG,
      query: useRAG ? 'key discussions, main topics, important points, decisions' : undefined,
      topK: AI_CONFIG.summarization.ragTopK,
      allMessages: messages,
    });
    
    const formattedMessages = formatMessagesForPrompt(relevantMessages, users);
    
    // Call OpenAI
    const completion = await retryWithBackoff(() => 
      openai.chat.completions.create({
        model: OPENAI_CONFIG.model,
        messages: [{
          role: 'system',
          content: 'You are a helpful assistant that summarizes team conversations. Provide clear, concise summaries.'
        }, {
          role: 'user',
          content: `Analyze this team chat thread with ${relevantMessages.length} messages and provide a structured summary.

Messages:
${formattedMessages}

Provide your response in JSON format with:
{
  "mainTopics": ["topic1", "topic2", ...],
  "keyPoints": ["point1", "point2", ...],
  "participantContributions": [{"userName": "...", "mainPoints": ["...", ...]}, ...],
  "summary": "2-3 sentence overview"
}

Focus on actionable insights and important discussions.`
        }],
        temperature: OPENAI_CONFIG.temperature,
        max_tokens: OPENAI_CONFIG.maxTokens,
        response_format: { type: "json_object" }
      })
    );
    
    // Parse response
    const content = completion.choices[0].message.content;
    if (!content) {
      throw new AIServiceError('Empty response from OpenAI', 'api_error');
    }
    
    const parsed = JSON.parse(content);
    
    // Build summary object
    const summary: ThreadSummary = {
      id: `summary_${chatId}_${Date.now()}`,
      chatId,
      mainTopics: parsed.mainTopics || [],
      keyPoints: parsed.keyPoints || [],
      participantContributions: parsed.participantContributions?.map((pc: any) => {
        // Find user ID from name
        const userId = Object.keys(users).find(
          uid => users[uid].displayName === pc.userName
        ) || 'unknown';
        return {
          userId,
          userName: pc.userName,
          mainPoints: pc.mainPoints || [],
        };
      }) || [],
      summary: parsed.summary || '',
      messageCount: relevantMessages.length,
      timestamp: new Date(),
      generatedAt: new Date(),
    };
    
    return summary;
    
  } catch (error) {
    if (error instanceof AIServiceError) {
      throw error;
    }
    throw new AIServiceError(
      'Failed to summarize thread',
      'api_error',
      error as Error
    );
  }
}

/**
 * FEATURE 2: Action Items Extraction
 * Extracts tasks, assignments, and deadlines from conversations
 */
export async function extractActionItems(
  chatId: string,
  messages: Message[],
  users: Record<string, User>,
  useRAG: boolean = AI_CONFIG.actionItems.useRAG
): Promise<ActionItem[]> {
  try {
    if (messages.length === 0) {
      return [];
    }
    
    // Get relevant messages (with optional RAG)
    const relevantMessages = await getRelevantMessages(chatId, {
      useRAG,
      query: useRAG ? 'action items, tasks, assignments, to-dos, deadlines, commitments' : undefined,
      topK: AI_CONFIG.actionItems.ragTopK,
      allMessages: messages,
    });
    
    const formattedMessages = formatMessagesForPrompt(relevantMessages, users);
    
    // Call OpenAI
    const completion = await retryWithBackoff(() =>
      openai.chat.completions.create({
        model: OPENAI_CONFIG.model,
        messages: [{
          role: 'system',
          content: 'You are an assistant that extracts action items from team conversations.'
        }, {
          role: 'user',
          content: `Extract all action items from this team conversation.

Messages:
${formattedMessages}

For each action item, identify:
- The task description
- Who is responsible (if mentioned)
- Any deadline or due date
- Priority level (high/medium/low)

Look for phrases like:
- "can you...", "please...", "need to..."
- "I'll...", "I will...", "let me..."
- "by [date]", "before [time]", "deadline"
- "urgent", "asap", "priority"

Return as JSON:
{
  "actionItems": [{
    "task": "description",
    "assignedToName": "name or null",
    "dueDate": "date string or null",
    "priority": "high|medium|low",
    "context": "surrounding conversation"
  }, ...]
}`
        }],
        temperature: OPENAI_CONFIG.temperature,
        max_tokens: OPENAI_CONFIG.maxTokens,
        response_format: { type: "json_object" }
      })
    );
    
    // Parse response
    const content = completion.choices[0].message.content;
    if (!content) {
      return [];
    }
    
    const parsed = JSON.parse(content);
    const items = parsed.actionItems || [];
    
    // Convert to ActionItem objects
    return items.map((item: any, index: number) => {
      // Find user ID from name
      const assignedTo = item.assignedToName
        ? Object.keys(users).find(
            uid => users[uid].displayName.toLowerCase().includes(item.assignedToName.toLowerCase())
          )
        : undefined;
      
      // Parse due date
      let dueDate: Date | undefined;
      if (item.dueDate) {
        try {
          dueDate = new Date(item.dueDate);
        } catch {
          dueDate = undefined;
        }
      }
      
      const actionItem: ActionItem = {
        id: `action_${chatId}_${Date.now()}_${index}`,
        chatId,
        task: item.task,
        assignedTo,
        assignedToName: item.assignedToName || undefined,
        dueDate,
        priority: item.priority || 'medium',
        context: item.context || '',
        sourceMessageId: relevantMessages[0]?.id || '',
        status: 'pending',
        extractedAt: new Date(),
      };
      
      return actionItem;
    });
    
  } catch (error) {
    if (error instanceof AIServiceError) {
      throw error;
    }
    throw new AIServiceError(
      'Failed to extract action items',
      'api_error',
      error as Error
    );
  }
}

/**
 * FEATURE 4: Priority Detection
 * Analyzes individual messages for urgency and priority
 */
export async function analyzePriority(
  message: Message,
  user?: User
): Promise<PriorityAnalysis> {
  try {
    // Fast rule-based pre-filter
    const urgencyKeywords = [
      'urgent', 'asap', 'immediately', 'critical', 'emergency',
      'blocker', 'deadline', 'now', 'today', 'right away'
    ];
    
    const text = message.text.toLowerCase();
    const hasUrgentKeyword = urgencyKeywords.some(kw => text.includes(kw));
    const hasMultipleExclamation = (message.text.match(/!/g) || []).length > 1;
    
    // If no urgency indicators, classify as low priority
    if (!hasUrgentKeyword && !hasMultipleExclamation) {
      return {
        messageId: message.id,
        priority: 'low',
        reasons: ['No urgency indicators found'],
        confidence: 0.8,
        analyzedAt: new Date(),
      };
    }
    
    // Use LLM for confirmation
    const completion = await retryWithBackoff(() =>
      openai.chat.completions.create({
        model: OPENAI_CONFIG.model,
        messages: [{
          role: 'system',
          content: 'You analyze messages for urgency and priority in team chats.'
        }, {
          role: 'user',
          content: `Analyze this message for urgency and priority:

"${message.text}"

Context: This is from a team work chat.

Classify as: urgent, high, medium, or low
Provide reasons for your classification.
Suggest if immediate action is needed.

Return as JSON:
{
  "priority": "urgent|high|medium|low",
  "reasons": ["reason1", "reason2", ...],
  "confidence": 0.0-1.0,
  "suggestedAction": "what to do (optional)"
}`
        }],
        temperature: 0.3, // Lower temperature for more consistent classification
        max_tokens: 300,
        response_format: { type: "json_object" }
      })
    );
    
    const content = completion.choices[0].message.content;
    if (!content) {
      throw new AIServiceError('Empty response from OpenAI', 'api_error');
    }
    
    const parsed = JSON.parse(content);
    
    const analysis: PriorityAnalysis = {
      messageId: message.id,
      priority: parsed.priority as MessagePriority,
      reasons: parsed.reasons || [],
      confidence: parsed.confidence || 0.7,
      suggestedAction: parsed.suggestedAction,
      analyzedAt: new Date(),
    };
    
    return analysis;
    
  } catch (error) {
    if (error instanceof AIServiceError) {
      throw error;
    }
    
    // Fallback to safe default on error
    return {
      messageId: message.id,
      priority: 'medium',
      reasons: ['Analysis failed, defaulting to medium priority'],
      confidence: 0.5,
      analyzedAt: new Date(),
    };
  }
}

/**
 * FEATURE 5: Decision Tracking
 * Identifies and surfaces decisions and agreements from conversations
 */
export async function trackDecisions(
  chatId: string,
  messages: Message[],
  users: Record<string, User>,
  useRAG: boolean = AI_CONFIG.decisions.useRAG
): Promise<Decision[]> {
  try {
    if (messages.length === 0) {
      return [];
    }
    
    // Get relevant messages (with optional RAG)
    const relevantMessages = await getRelevantMessages(chatId, {
      useRAG,
      query: useRAG ? 'decisions, agreements, consensus, approvals, commitments, confirmed' : undefined,
      topK: AI_CONFIG.decisions.ragTopK,
      allMessages: messages,
    });
    
    const formattedMessages = formatMessagesForPrompt(relevantMessages, users);
    
    // Call OpenAI
    const completion = await retryWithBackoff(() =>
      openai.chat.completions.create({
        model: OPENAI_CONFIG.model,
        messages: [{
          role: 'system',
          content: 'You extract decisions and agreements from team conversations.'
        }, {
          role: 'user',
          content: `Identify all decisions or agreements made in this conversation.

Messages:
${formattedMessages}

Look for:
- Explicit decisions: "let's go with option A", "we'll do X"
- Consensus: "everyone agrees on...", "sounds good to all"
- Commitments: "we decided to...", "agreed upon"
- Approvals: "approved", "confirmed", "let's proceed"

For each decision, extract:
- What was decided
- Who agreed/approved (names)
- Context/reasoning
- Category (technical/business/scheduling/process/other)

Return as JSON:
{
  "decisions": [{
    "decision": "what was decided",
    "agreedByNames": ["name1", "name2", ...],
    "context": "surrounding conversation",
    "category": "technical|business|scheduling|process|other"
  }, ...]
}`
        }],
        temperature: OPENAI_CONFIG.temperature,
        max_tokens: OPENAI_CONFIG.maxTokens,
        response_format: { type: "json_object" }
      })
    );
    
    const content = completion.choices[0].message.content;
    if (!content) {
      return [];
    }
    
    const parsed = JSON.parse(content);
    const decisions = parsed.decisions || [];
    
    // Convert to Decision objects
    return decisions.map((dec: any, index: number) => {
      // Find user IDs from names
      const agreedBy = (dec.agreedByNames || []).map((name: string) => {
        return Object.keys(users).find(
          uid => users[uid].displayName.toLowerCase().includes(name.toLowerCase())
        );
      }).filter(Boolean) as string[];
      
      const decision: Decision = {
        id: `decision_${chatId}_${Date.now()}_${index}`,
        chatId,
        decision: dec.decision,
        agreedBy,
        agreedByNames: dec.agreedByNames || [],
        context: dec.context || '',
        sourceMessageIds: relevantMessages.slice(0, 3).map(m => m.id), // First 3 relevant messages
        timestamp: new Date(),
        category: dec.category || 'other',
        extractedAt: new Date(),
      };
      
      return decision;
    });
    
  } catch (error) {
    if (error instanceof AIServiceError) {
      throw error;
    }
    throw new AIServiceError(
      'Failed to track decisions',
      'api_error',
      error as Error
    );
  }
}

/**
 * Export AI service
 */
export const aiService = {
  summarizeThread,
  extractActionItems,
  analyzePriority,
  trackDecisions,
};

