/**
 * Language Service
 * Handles language detection and user language preferences
 */

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { firestore } from './firebase';
import { TranslationError } from '../types/translation';
import * as Localization from 'expo-localization';

/**
 * Get user's preferred language from Firestore
 */
export async function getUserLanguage(userId: string): Promise<string> {
  try {
    const userDoc = await getDoc(doc(firestore, 'users', userId));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return userData.preferredLanguage || getDeviceLanguage();
    }
    
    // User doesn't exist yet, use device language
    return getDeviceLanguage();
  } catch (error) {
    console.error('Error getting user language:', error);
    return getDeviceLanguage();
  }
}

/**
 * Set user's preferred language in Firestore
 */
export async function setUserLanguage(
  userId: string,
  languageCode: string
): Promise<void> {
  try {
    await setDoc(
      doc(firestore, 'users', userId),
      { preferredLanguage: languageCode },
      { merge: true }
    );
  } catch (error) {
    console.error('Error setting user language:', error);
    throw new TranslationError(
      'Failed to save language preference',
      'api_error',
      error as Error
    );
  }
}

/**
 * Get device language as fallback
 * Returns ISO 639-1 language code (e.g., 'en', 'es', 'fr')
 */
export function getDeviceLanguage(): string {
  try {
    // Get device locales
    const locales = Localization.getLocales();
    
    if (locales && locales.length > 0) {
      // Get the first locale's language code
      const languageCode = locales[0].languageCode;
      
      // Return just the language code (e.g., 'en' from 'en-US')
      return languageCode || 'en';
    }
    
    // Fallback to English
    return 'en';
  } catch (error) {
    console.error('Error getting device language:', error);
    return 'en';
  }
}

/**
 * Get language name from ISO code
 */
export function getLanguageName(languageCode: string): string {
  const languageNames: Record<string, string> = {
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    it: 'Italian',
    pt: 'Portuguese',
    ru: 'Russian',
    zh: 'Chinese',
    ja: 'Japanese',
    ko: 'Korean',
    ar: 'Arabic',
    hi: 'Hindi',
    tr: 'Turkish',
    pl: 'Polish',
    nl: 'Dutch',
    sv: 'Swedish',
    da: 'Danish',
    fi: 'Finnish',
    no: 'Norwegian',
    cs: 'Czech',
    el: 'Greek',
    he: 'Hebrew',
    th: 'Thai',
    vi: 'Vietnamese',
    id: 'Indonesian',
    unknown: 'Unknown',
    xx: 'Unknown', // OpenAI sometimes returns 'xx' for unknown
  };
  
  return languageNames[languageCode] || languageCode.toUpperCase();
}

/**
 * Get language name in its native script
 * Used for language selection UI
 */
export function getNativeLanguageName(languageCode: string): string {
  const nativeLanguageNames: Record<string, string> = {
    en: 'English',
    es: 'Español',
    fr: 'Français',
    de: 'Deutsch',
    it: 'Italiano',
    pt: 'Português',
    ru: 'Русский',
    zh: '中文',
    ja: '日本語',
    ko: '한국어',
    ar: 'العربية',
    hi: 'हिन्दी',
    tr: 'Türkçe',
    pl: 'Polski',
    nl: 'Nederlands',
    sv: 'Svenska',
    da: 'Dansk',
    fi: 'Suomi',
    no: 'Norsk',
    cs: 'Čeština',
    el: 'Ελληνικά',
    he: 'עברית',
    th: 'ไทย',
    vi: 'Tiếng Việt',
    id: 'Bahasa Indonesia',
    unknown: 'Unknown',
    xx: 'Unknown',
  };
  
  return nativeLanguageNames[languageCode] || languageCode.toUpperCase();
}

/**
 * Get flag emoji for language code
 */
export function getLanguageFlag(languageCode: string): string {
  const flags: Record<string, string> = {
    en: '🇺🇸',
    es: '🇪🇸',
    fr: '🇫🇷',
    de: '🇩🇪',
    it: '🇮🇹',
    pt: '🇵🇹',
    ru: '🇷🇺',
    zh: '🇨🇳',
    ja: '🇯🇵',
    ko: '🇰🇷',
    ar: '🇸🇦',
    hi: '🇮🇳',
    tr: '🇹🇷',
    pl: '🇵🇱',
    nl: '🇳🇱',
    sv: '🇸🇪',
    da: '🇩🇰',
    fi: '🇫🇮',
    no: '🇳🇴',
    cs: '🇨🇿',
    el: '🇬🇷',
    he: '🇮🇱',
    th: '🇹🇭',
    vi: '🇻🇳',
    id: '🇮🇩',
  };
  return flags[languageCode] || '🌐';
}

/**
 * Common languages for selection UI
 */
export const COMMON_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
];

