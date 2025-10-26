/**
 * i18n Configuration
 * Configures internationalization for the app
 */

import { I18n } from 'i18n-js';

// Create i18n instance FIRST
const i18n = new I18n();

// Configure BEFORE loading translations (important for Metro bundler)
i18n.defaultLocale = 'en';
i18n.locale = 'en';
i18n.fallbacks = true;

// Lazy load translations AFTER configuration
try {
  const getTranslations = () => ({
    en: require('./translations/en').default,
    es: require('./translations/es').default,
    fr: require('./translations/fr').default,
  });
  
  i18n.store(getTranslations());
} catch (error) {
  console.error('[i18n] Error loading translations:', error);
  // Fallback: empty translations to prevent crashes
  i18n.store({ en: { common: { create: 'Create' } }, es: {}, fr: {} });
}

export default i18n;

/**
 * Set the app's language
 * @param languageCode ISO 639-1 language code (e.g., 'en', 'es', 'fr')
 */
export function setAppLanguage(languageCode: string): void {
  try {
    i18n.locale = languageCode;
    console.log(`[i18n] Language set to: ${languageCode}`);
  } catch (error) {
    console.error('[i18n] Error setting language:', error);
  }
}

/**
 * Get the current app language
 * @returns Current language code
 */
export function getAppLanguage(): string {
  return i18n.locale;
}

/**
 * Translate a key
 * @param key Translation key (e.g., 'common.cancel')
 * @param options Optional parameters for interpolation
 * @returns Translated string
 */
export function translate(key: string, options?: object): string {
  return i18n.t(key, options);
}

/**
 * Check if a language is supported
 * @param languageCode ISO 639-1 language code
 * @returns true if supported, false otherwise
 */
export function isLanguageSupported(languageCode: string): boolean {
  return ['en', 'es', 'fr'].includes(languageCode);
}

/**
 * Get list of supported languages
 * @returns Array of supported language codes
 */
export function getSupportedLanguages(): string[] {
  return ['en', 'es', 'fr'];
}

