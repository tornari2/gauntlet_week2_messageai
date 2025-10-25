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
  // TEMPORARY: Skip auth check for testing
  // TODO: Re-enable auth once token passing is fixed
  // if (!context.auth) {
  //   throw new functions.https.HttpsError('unauthenticated', 'Must be logged in to translate text');
  // }

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

    const translatedText = response.choices[0].message.content?.trim() || text;

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
 * Detects the language of a text
 */
export const detectLanguage = functions.https.onCall(async (data, context) => {
  // TEMPORARY: Skip auth check for testing
  // TODO: Re-enable auth once token passing is fixed
  // if (!context.auth) {
  //   throw new functions.https.HttpsError('unauthenticated', 'Must be logged in to detect language');
  // }

  const { text } = data;

  if (!text) {
    throw new functions.https.HttpsError('invalid-argument', 'Text is required');
  }

  try {
    const prompt = `Detect the language of this text. 
Respond with ONLY the ISO 639-1 language code (e.g., 'en', 'es', 'fr', 'zh', 'ar').

Text: "${text}"

Language code:`;

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 10,
    });

    const languageCode = response.choices[0].message.content?.trim().toLowerCase() || 'en';

    return {
      languageCode,
    };
  } catch (error) {
    console.error('Error detecting language:', error);
    throw new functions.https.HttpsError('internal', 'Failed to detect language');
  }
});

/**
 * 3. Adjust Formality
 * Rewrites text with specified formality level
 */
export const adjustFormality = functions.https.onCall(async (data, context) => {
  // TEMPORARY: Skip auth check for testing
  // TODO: Re-enable auth once token passing is fixed
  // if (!context.auth) {
  //   throw new functions.https.HttpsError('unauthenticated', 'Must be logged in to adjust formality');
  // }

  const { text, formalityLevel, targetLanguage } = data;

  if (!text || !formalityLevel || !targetLanguage) {
    throw new functions.https.HttpsError('invalid-argument', 'Text, formality level, and target language are required');
  }

  try {
    const formalityDescriptions = {
      casual: 'Friendly, relaxed, conversational',
      neutral: 'Professional but approachable',
      formal: 'Respectful, polite, business-appropriate',
    };

    const prompt = `Rewrite this message in a ${formalityLevel} tone in ${targetLanguage}.
Maintain the core meaning but adjust the formality level appropriately.

IMPORTANT: Return ONLY the rephrased sentence or message. Do NOT add any letter formatting, greetings, or closings like "Dear X" or "Sincerely". Just rephrase the original message with the appropriate level of formality.

Formality level: ${formalityLevel} - ${formalityDescriptions[formalityLevel as keyof typeof formalityDescriptions]}

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
    console.error('Error adjusting formality:', error);
    throw new functions.https.HttpsError('internal', 'Failed to adjust formality');
  }
});

/**
 * 4. Explain Slang/Idioms
 * Identifies and explains slang and idioms
 */
export const explainSlang = functions.https.onCall(async (data, context) => {
  // TEMPORARY: Skip auth check for testing
  // TODO: Re-enable auth once token passing is fixed
  // if (!context.auth) {
  //   throw new functions.https.HttpsError('unauthenticated', 'Must be logged in to explain slang');
  // }

  const { text, detectedLanguage } = data;

  if (!text || !detectedLanguage) {
    throw new functions.https.HttpsError('invalid-argument', 'Text and detected language are required');
  }

  try {
    const prompt = `Identify any slang, idioms, or informal expressions in this ${detectedLanguage} message.
For each one found, provide:
1. The slang/idiom
2. Literal meaning
3. Actual meaning/usage
4. Example in context

If none found, return an empty array.

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
  // TEMPORARY: Skip auth check for testing
  // TODO: Re-enable auth once token passing is fixed
  // if (!context.auth) {
  //   throw new functions.https.HttpsError('unauthenticated', 'Must be logged in to get cultural context');
  // }

  const { text, detectedLanguage } = data;

  if (!text || !detectedLanguage) {
    throw new functions.https.HttpsError('invalid-argument', 'Text and detected language are required');
  }

  try {
    const prompt = `Analyze this message for cultural context and references.
Consider the language (${detectedLanguage}) and provide helpful cultural insights.
If there are no significant cultural references, say "No specific cultural context detected."

Message: "${text}"

Format your response as JSON with keys:
- culturalInsights: string (main explanation)
- references: array of strings (specific cultural references found)`;

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
  // TEMPORARY: Skip auth check for testing
  // TODO: Re-enable auth once token passing is fixed
  // if (!context.auth) {
  //   throw new functions.https.HttpsError('unauthenticated', 'Must be logged in to summarize thread');
  // }

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
