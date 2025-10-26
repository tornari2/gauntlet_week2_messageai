/**
 * i18n Configuration - MINIMAL STUB FOR DEBUGGING
 * NO external dependencies - just pure JavaScript
 */

console.log('[i18n] 🟢 Module loading started');

// Create a minimal mock i18n object
const i18n = {
  t: (key: string, options?: any) => {
    console.log(`[i18n-stub] t() called with key: ${key}`);
    // Just return the key for now
    return key || 'MISSING_KEY';
  },
  language: 'en',
  changeLanguage: (lng: string) => {
    console.log(`[i18n-stub] changeLanguage() called with: ${lng}`);
  },
  isInitialized: true,
};

console.log('[i18n] 🟢 i18n object created successfully');
console.log('[i18n] 🟢 Exporting default...');

export default i18n;

console.log('[i18n] 🟢 Default exported');

/**
 * Set the app's language
 */
export function setAppLanguage(languageCode: string): void {
  console.log(`[i18n] setAppLanguage() called with: ${languageCode}`);
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

console.log('[i18n] 🟢 Module loading complete - all exports ready');




