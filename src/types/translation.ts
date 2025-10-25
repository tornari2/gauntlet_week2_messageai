/**
 * Translation Types
 * Types for International Communicator AI features
 */

/**
 * Translation result from AI service
 */
export interface TranslationResult {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
}

/**
 * Formality levels for message adjustment
 */
export type FormalityLevel = 'casual' | 'neutral' | 'formal';

/**
 * Slang or idiom explanation
 */
export interface SlangExplanation {
  term: string;
  literal: string;
  meaning: string;
  example: string;
}

/**
 * Multilingual thread summary
 */
export interface MultilingualSummary {
  overview: string;
  participantSummaries: {
    participantName: string;
    keyPoints: string[];
  }[];
  languagesDetected: string[];
  generatedIn: string;
  timestamp: Date;
}

/**
 * Cultural context information
 */
export interface CulturalContext {
  messageText: string;
  detectedLanguage: string;
  culturalInsights: string;
  references: string[];
}

/**
 * Translation error types
 */
export class TranslationError extends Error {
  constructor(
    message: string,
    public code: 'api_error' | 'network_error' | 'invalid_input' | 'rate_limit' | 'unknown',
    public originalError?: Error
  ) {
    super(message);
    this.name = 'TranslationError';
  }
}

