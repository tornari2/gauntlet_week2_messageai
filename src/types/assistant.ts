/**
 * AI Assistant TypeScript Types
 */

export interface AIAssistantResponse {
  response: {
    summary?: string;
    actionItems?: ActionItem[];
    importantDates?: ImportantDate[];
    toneAnalysis?: ToneAnalysis;
    sources?: MessageSource[];
  };
  metadata: {
    toolCallsUsed: number;
    usedRAG: boolean;
    usedFunctionCalling: boolean;
  };
}

export interface ActionItem {
  item: string;
  priority?: 'high' | 'medium' | 'low';
  assignee?: string;
}

export interface ImportantDate {
  date: string;
  description: string;
  isDeadline?: boolean;
}

export interface ToneAnalysis {
  overall: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  details: string;
  keyEmotions?: string[];
}

export interface MessageSource {
  messageId: string;
  text: string;
}

export interface AIAssistantQuery {
  chatId: string;
  query: string;
  userLanguage?: string;
}

