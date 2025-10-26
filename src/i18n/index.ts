/**
 * i18n Configuration using react-i18next
 * More robust and React Native friendly
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './translations/en';
import es from './translations/es';
import fr from './translations/fr';

// Initialize i18next SYNCHRONOUSLY (important!)
i18n
  .use(initReactI18next) // Connect with React
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
      fr: { translation: fr },
    },
    lng: 'en', // Default language
    fallbackLng: 'en', // Fallback language
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    compatibilityJSON: 'v3', // Important for React Native
    initImmediate: false, // CRITICAL: Make initialization synchronous
    react: {
      useSuspense: false, // Disable suspense for React Native
    },
  });

// Verify initialization succeeded
if (!i18n.isInitialized) {
  console.error('[i18n] FAILED to initialize!');
} else {
  console.log('[i18n] Successfully initialized');
}

export default i18n;

/**
 * Set the app's language
 * @param languageCode ISO 639-1 language code (e.g., 'en', 'es', 'fr')
 */
export function setAppLanguage(languageCode: string): void {
  i18n.changeLanguage(languageCode);
  console.log(`[i18n] Language changed to: ${languageCode}`);
}

/**
 * Get the current app language
 * @returns Current language code
 */
export function getAppLanguage(): string {
  return i18n.language;
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


