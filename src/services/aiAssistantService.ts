/**
 * AI Assistant Service
 * 
 * Client-side service for interacting with the intelligent chat assistant
 */

import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';
import { AIAssistantResponse, AIAssistantQuery } from '../types/assistant';

/**
 * Query the intelligent AI assistant with natural language
 * 
 * Examples:
 * - "Summarize this conversation"
 * - "What did we discuss about the project?"
 * - "Show me action items from last week"
 * - "What's the tone of our conversation?"
 * - "Summarize everything John said since Monday"
 */
export async function queryAIAssistant(
  chatId: string,
  query: string,
  userLanguage: string = 'English'
): Promise<AIAssistantResponse> {
  try {
    const assistantFunction = httpsCallable<AIAssistantQuery, AIAssistantResponse>(
      functions,
      'intelligentChatAssistant'
    );
    
    const result = await assistantFunction({
      chatId,
      query,
      userLanguage,
    });

    return result.data;
  } catch (error) {
    console.error('Error querying AI assistant:', error);
    throw error;
  }
}

/**
 * Format AI assistant response for display
 */
export function formatAssistantResponse(response: AIAssistantResponse): string {
  const { response: data } = response;
  let formatted = '';

  if (data.summary) {
    formatted += `${data.summary}\n\n`;
  }

  if (data.actionItems && data.actionItems.length > 0) {
    formatted += '📋 **Action Items:**\n';
    data.actionItems.forEach((item, index) => {
      const priority = item.priority ? ` [${item.priority.toUpperCase()}]` : '';
      const assignee = item.assignee ? ` (${item.assignee})` : '';
      formatted += `${index + 1}. ${item.item}${priority}${assignee}\n`;
    });
    formatted += '\n';
  }

  if (data.importantDates && data.importantDates.length > 0) {
    formatted += '📅 **Important Dates:**\n';
    data.importantDates.forEach((dateInfo, index) => {
      const deadline = dateInfo.isDeadline ? ' [DEADLINE]' : '';
      formatted += `${index + 1}. ${dateInfo.date}: ${dateInfo.description}${deadline}\n`;
    });
    formatted += '\n';
  }

  if (data.toneAnalysis) {
    formatted += `🎭 **Conversation Tone:**\n`;
    formatted += `Overall: ${data.toneAnalysis.overall} (${data.toneAnalysis.sentiment})\n`;
    if (data.toneAnalysis.details) {
      formatted += `${data.toneAnalysis.details}\n`;
    }
    if (data.toneAnalysis.keyEmotions && data.toneAnalysis.keyEmotions.length > 0) {
      formatted += `Key emotions: ${data.toneAnalysis.keyEmotions.join(', ')}\n`;
    }
  }

  return formatted.trim();
}

