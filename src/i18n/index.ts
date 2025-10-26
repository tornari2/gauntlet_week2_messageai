/**
 * i18n Configuration
 * Configures internationalization for the app
 */

import { I18n } from 'i18n-js';
import en from './translations/en';
import es from './translations/es';
import fr from './translations/fr';

// Create i18n instance with explicit translations
const i18n = new I18n();

// Set translations
i18n.translations = {
  en,
  es,
  fr,
};

// Configure i18n
i18n.defaultLocale = 'en';
i18n.locale = 'en';
i18n.fallbacks = true;

export default i18n;

/**
 * Set the app's language
 * @param languageCode ISO 639-1 language code (e.g., 'en', 'es', 'fr')
 */
export function setAppLanguage(languageCode: string): void {
  i18n.locale = languageCode;
  console.log(`[i18n] Language set to: ${languageCode}`);
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

