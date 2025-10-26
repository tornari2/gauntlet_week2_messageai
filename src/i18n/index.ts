/**
 * i18n Configuration using react-i18next
 * TEMPORARY STUB - Testing if i18n is the problem
 */

// Create a minimal mock i18n object
const i18n = {
  t: (key: string, options?: any) => {
    // Just return the key for now
    return key;
  },
  language: 'en',
  changeLanguage: (lng: string) => {
    console.log(`[i18n-stub] Language change requested: ${lng}`);
  },
  isInitialized: true,
};

console.log('[i18n] ⚠️  Using STUB implementation for debugging');

export default i18n;

/**
 * Set the app's language
 */
export function setAppLanguage(languageCode: string): void {
  i18n.changeLanguage(languageCode);
}

/**
 * Get the current app language
 */
export function getAppLanguage(): string {
  return i18n.language;
}

/**
 * Translate a key
 */
export function translate(key: string, options?: object): string {
  return i18n.t(key, options);
}

/**
 * Check if a language is supported
 */
export function isLanguageSupported(languageCode: string): boolean {
  return ['en', 'es', 'fr'].includes(languageCode);
}

/**
 * Get list of supported languages
 */
export function getSupportedLanguages(): string[] {
  return ['en', 'es', 'fr'];
}



