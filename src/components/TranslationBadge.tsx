/**
 * TranslationBadge Component
 * Shows language badge and allows translation on tap
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ActivityIndicator } from 'react-native';
import { Message } from '../types';
import i18n from '../i18n';

interface TranslationBadgeProps {
  message: Message;
  userLanguage: string;
  translated: boolean;
  translating: boolean;
  autoTranslated?: boolean; // Was it auto-translated?
  onTranslate: () => void;
  onShowOriginal?: () => void;
}

export const TranslationBadge: React.FC<TranslationBadgeProps> = ({
  message,
  userLanguage,
  translated,
  translating,
  autoTranslated = false,
  onTranslate,
  onShowOriginal,
}) => {
  const detectedLanguage = message.detectedLanguage || 'unknown';
  // Treat 'xx' (OpenAI's unknown language code) and 'und' as 'unknown'
  const isUnknownLanguage = detectedLanguage === 'xx' || detectedLanguage === 'und' || detectedLanguage === 'unknown' || !detectedLanguage;
  const normalizedLanguage = isUnknownLanguage ? 'unknown' : detectedLanguage;
  const isDifferentLanguage = normalizedLanguage !== userLanguage && normalizedLanguage !== 'unknown';
  
  // Debug check for any message with detected language
  if (message.detectedLanguage && message.detectedLanguage !== 'en') {
    console.log(`[BADGE] Message "${message.text}": detected=${normalizedLanguage}, user=${userLanguage}, different=${isDifferentLanguage}`);
  }
  
  if (!isDifferentLanguage && !translated) {
    return null;
  }

  // Get language name, showing "Language Unknown" for unknown languages
  const languageName = isUnknownLanguage 
    ? i18n.t('errors.languageUnknown')
    : (i18n.t(`languages.${normalizedLanguage}`) || normalizedLanguage.toUpperCase());

  if (translated) {
    return (
      <View style={styles.container}>
        <View style={[styles.badge, styles.translatedBadge]}>
          <Text style={styles.translatedText}>
            {autoTranslated ? '🤖 ' : '✓ '}
            {i18n.t('messageActions.translatedFrom')} {languageName}
          </Text>
        </View>
        {onShowOriginal && (
          <TouchableOpacity 
            onPress={onShowOriginal}
            style={styles.showOriginalButton}
            hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
          >
            <Text style={styles.showOriginalText}>{i18n.t('messageActions.showOriginal')}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <TouchableOpacity
      onPress={onTranslate}
      style={[styles.badge, styles.untranslatedBadge]}
      disabled={translating}
      hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
    >
      {translating ? (
        <>
          <ActivityIndicator size="small" color="#1976D2" style={styles.spinner} />
          <Text style={styles.untranslatedText}>{i18n.t('translation.translating')}</Text>
        </>
      ) : (
        <>
          <Text style={styles.untranslatedText}>{languageName.toUpperCase()}</Text>
          <Text style={styles.tapHint}> • {i18n.t('translation.tapToTranslate')}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  untranslatedBadge: {
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#1976D2',
  },
  translatedBadge: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  icon: {
    fontSize: 12,
    marginRight: 4,
  },
  untranslatedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1976D2',
  },
  translatedText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#2E7D32',
  },
  tapHint: {
    fontSize: 10,
    color: '#1976D2',
    opacity: 0.8,
  },
  spinner: {
    marginRight: 4,
  },
  showOriginalButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  showOriginalText: {
    fontSize: 11,
    color: '#1976D2',
    textDecorationLine: 'underline',
  },
});

