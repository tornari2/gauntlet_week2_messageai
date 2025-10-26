# Internationalization (i18n) Implementation Plan

## ✅ Task 1: Native Language Names (COMPLETE)

**Status:** Done
**File:** `src/services/languageService.ts`
**Function:** `getNativeLanguageName(languageCode)`

**Next Step:** Update UserProfileScreen to use this function

---

## 📋 Task 2: Full App Internationalization

### Overview
Translate ALL static UI text to the user's preferred language.

### Difficulty: ⭐⭐⭐ MODERATE (3-4 hours)

---

## 🏗️ Implementation Strategy

### **Option A: React Native i18n Library** (Recommended)

**Library:** `i18n-js` or `react-i18next`

**Pros:**
- Industry standard
- Handles plurals, interpolation
- Easy to maintain
- Community support

**Cons:**
- Need to create translation files
- ~200-300 strings to translate

### **Option B: OpenAI Dynamic Translation** (Innovative)

**Approach:** Translate UI strings on-demand using OpenAI

**Pros:**
- No manual translation files
- Supports any language instantly
- Easy to add new strings

**Cons:**
- Slight delay on first load
- API costs (minimal with caching)
- Need caching strategy

---

## 🎯 Recommended: Hybrid Approach

1. **Core UI:** Use i18n library with pre-translated strings
2. **AI Responses:** Already in user's language (pass userLanguage to prompts)
3. **Dynamic Content:** Use OpenAI for edge cases

---

## 📝 Implementation Steps

### Step 1: Install i18n Library (5 minutes)

```bash
npm install i18n-js
```

### Step 2: Create Translation Files (30 minutes)

**File Structure:**
```
src/i18n/
  ├── index.ts          # i18n configuration
  ├── translations/
      ├── en.ts         # English (base)
      ├── es.ts         # Spanish
      ├── fr.ts         # French
      └── ...
```

**Example: `src/i18n/translations/en.ts`**
```typescript
export default {
  // Common
  common: {
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    send: 'Send',
    loading: 'Loading...',
    error: 'Error',
  },
  
  // Chat Screen
  chat: {
    typing: 'Type a message...',
    sending: 'Sending...',
    deleteConfirm: 'Delete this chat?',
    online: 'Online',
    offline: 'Offline',
  },
  
  // Message Actions
  messageActions: {
    title: 'Message Options',
    culturalContext: 'Explain Cultural Context',
    explainSlang: 'Explain Slang',
    translate: 'Translate',
    showOriginal: 'Show Original',
  },
  
  // Profile
  profile: {
    title: 'Profile',
    displayName: 'Display Name',
    email: 'Email',
    language: 'Preferred Language',
    logout: 'Logout',
  },
  
  // Auto-translate
  autoTranslate: {
    enabled: 'Auto-translate enabled',
    disabled: 'Auto-translate disabled',
  },
  
  // Formality
  formality: {
    title: 'Adjust Formality',
    original: 'Original Message',
    casual: 'Casual',
    neutral: 'Neutral',
    formal: 'Formal',
    casualDesc: 'Friendly, relaxed, conversational',
    neutralDesc: 'Professional but approachable',
    formalDesc: 'Respectful, polite, business-appropriate',
    applyChanges: 'Apply Changes',
    selectVersion: 'Select a Version',
  },
};
```

**Spanish: `src/i18n/translations/es.ts`**
```typescript
export default {
  common: {
    cancel: 'Cancelar',
    save: 'Guardar',
    delete: 'Eliminar',
    send: 'Enviar',
    loading: 'Cargando...',
    error: 'Error',
  },
  
  chat: {
    typing: 'Escribe un mensaje...',
    sending: 'Enviando...',
    deleteConfirm: '¿Eliminar este chat?',
    online: 'En línea',
    offline: 'Desconectado',
  },
  
  messageActions: {
    title: 'Opciones de Mensaje',
    culturalContext: 'Explicar Contexto Cultural',
    explainSlang: 'Explicar Jerga',
    translate: 'Traducir',
    showOriginal: 'Mostrar Original',
  },
  
  profile: {
    title: 'Perfil',
    displayName: 'Nombre para Mostrar',
    email: 'Correo Electrónico',
    language: 'Idioma Preferido',
    logout: 'Cerrar Sesión',
  },
  
  autoTranslate: {
    enabled: 'Traducción automática activada',
    disabled: 'Traducción automática desactivada',
  },
  
  formality: {
    title: 'Ajustar Formalidad',
    original: 'Mensaje Original',
    casual: 'Casual',
    neutral: 'Neutral',
    formal: 'Formal',
    casualDesc: 'Amigable, relajado, conversacional',
    neutralDesc: 'Profesional pero accesible',
    formalDesc: 'Respetuoso, cortés, apropiado para negocios',
    applyChanges: 'Aplicar Cambios',
    selectVersion: 'Seleccionar una Versión',
  },
};
```

### Step 3: Configure i18n (15 minutes)

**`src/i18n/index.ts`:**
```typescript
import { I18n } from 'i18n-js';
import en from './translations/en';
import es from './translations/es';
import fr from './translations/fr';
// ... import other languages

const i18n = new I18n({
  en,
  es,
  fr,
  // ... add other languages
});

// Set default locale
i18n.defaultLocale = 'en';
i18n.enableFallback = true;

export default i18n;

// Helper to set language
export function setAppLanguage(languageCode: string) {
  i18n.locale = languageCode;
}

// Helper to get current language
export function getAppLanguage(): string {
  return i18n.locale;
}
```

### Step 4: Update Components to Use Translations (2 hours)

**Example: MessageBubble.tsx**

**Before:**
```typescript
Alert.alert(
  'Message Options',
  subtitle,
  [
    { text: 'Cancel', style: 'cancel' },
    { text: '🧠 Explain Cultural Context', onPress: () => { /* ... */ } },
    { text: '💬 Explain Slang', onPress: () => { /* ... */ } },
  ]
);
```

**After:**
```typescript
import i18n from '../i18n';

Alert.alert(
  i18n.t('messageActions.title'),
  subtitle,
  [
    { text: i18n.t('common.cancel'), style: 'cancel' },
    { text: `🧠 ${i18n.t('messageActions.culturalContext')}`, onPress: () => { /* ... */ } },
    { text: `💬 ${i18n.t('messageActions.explainSlang')}`, onPress: () => { /* ... */ } },
  ]
);
```

**Example: FormalitySelector.tsx**

**Before:**
```typescript
<Text style={styles.title}>Adjust Formality</Text>
```

**After:**
```typescript
import i18n from '../i18n';

<Text style={styles.title}>{i18n.t('formality.title')}</Text>
```

### Step 5: Sync with User Language Preference (30 minutes)

**Update stores/translationStore.ts:**
```typescript
import { setAppLanguage } from '../i18n';

setUserLanguage: async (language, userId) => {
  try {
    await languageService.setUserLanguage(userId, language);
    set({ userLanguage: language });
    setAppLanguage(language); // Update i18n locale
  } catch (error) {
    console.error('Error setting user language:', error);
  }
},

loadUserLanguage: async (userId) => {
  try {
    const language = await languageService.getUserLanguage(userId);
    set({ userLanguage: language });
    setAppLanguage(language); // Update i18n locale
  } catch (error) {
    console.error('Error loading user language:', error);
    const deviceLanguage = languageService.getDeviceLanguage();
    set({ userLanguage: deviceLanguage });
    setAppLanguage(deviceLanguage);
  }
},
```

### Step 6: Update AI Responses to Use User's Language (30 minutes)

**Modify Cloud Functions to include target language in prompts:**

**Example: `functions/src/index.ts` - Cultural Context**
```typescript
export const getCulturalContext = functions.https.onCall(async (data, context) => {
  // ... auth check
  
  const { text, sourceLanguage, targetLanguage } = data; // Add targetLanguage
  
  const prompt = `Analyze the cultural context of this ${sourceLanguage} message and explain it IN ${targetLanguage}.
  
  Message: "${text}"
  
  Explain in ${targetLanguage}:
  1. Cultural references
  2. Idioms or expressions
  3. Context that might be lost in translation
  
  Response must be in ${targetLanguage}.`;
  
  // ... rest of function
});
```

**Update client calls to pass targetLanguage:**
```typescript
// src/services/translationService.ts
export async function getCulturalContext(
  text: string,
  sourceLanguage: string,
  targetLanguage: string // Add this parameter
): Promise<CulturalContext> {
  const getCulturalContextFn = httpsCallable(functions, 'getCulturalContext');
  
  return retryWithBackoff(async () => {
    const result = await getCulturalContextFn({
      text,
      sourceLanguage,
      targetLanguage, // Pass user's language
    });
    // ...
  });
}
```

---

## 📁 Files That Need Translation

### High Priority (User-facing text):
1. ✅ `src/components/MessageBubble.tsx` - Message actions
2. ✅ `src/components/FormalitySelector.tsx` - Formality UI
3. ✅ `src/components/MessageInput.tsx` - Placeholder text
4. ✅ `src/screens/ChatScreen.tsx` - Chat UI labels
5. ✅ `src/screens/UserProfileScreen.tsx` - Profile labels
6. ✅ `src/screens/ChatsListScreen.tsx` - Chat list UI
7. ✅ `src/screens/NewChatScreen.tsx` - New chat UI
8. ✅ `src/components/CulturalContextModal.tsx` - Modal text
9. ✅ `src/components/SlangExplanationModal.tsx` - Modal text
10. ✅ `src/components/MultilingualSummaryModal.tsx` - Modal text

### Medium Priority:
11. `src/components/ConnectionStatus.tsx` - Connection messages
12. `src/components/OnlineIndicator.tsx` - Online/offline text
13. `src/components/TypingIndicator.tsx` - Typing text
14. Alert messages throughout the app

### Low Priority:
15. Error messages
16. Loading states
17. Empty states

---

## 🌍 Languages to Support

**Tier 1 (Must Have):**
- English
- Spanish
- French
- German
- Italian
- Portuguese

**Tier 2 (Should Have):**
- Russian
- Chinese
- Japanese
- Korean
- Arabic
- Hindi

**Tier 3 (Nice to Have):**
- Turkish, Polish, Dutch, Swedish, Danish, Finnish,
  Norwegian, Czech, Greek, Hebrew, Thai, Vietnamese, Indonesian

---

## 💰 Cost Estimate

### Using i18n Library (Pre-translated)
- **Time:** 3-4 hours initial setup
- **Cost:** $0 (free library)
- **Maintenance:** Add translations when adding new features

### Using OpenAI Dynamic Translation
- **Time:** 2 hours setup
- **Cost:** ~$0.10/month per user (with caching)
- **Maintenance:** Zero (automatic)

---

## 🚀 Quick Start (Minimal Viable Implementation)

If you want to start simple:

1. **Install i18n:** `npm install i18n-js`
2. **Add 3 languages:** English, Spanish, French
3. **Translate top 10 screens** (listed above)
4. **Update AI prompts** to respond in user's language
5. **Test thoroughly** with each language

**Total Time:** 2-3 hours for MVP

---

## 📝 Next Steps

**Option 1:** Let me implement the full i18n system (3-4 hours)
- I'll create all translation files
- Update all components
- Modify Cloud Functions
- Test with multiple languages

**Option 2:** Start with MVP (2 hours)
- English, Spanish, French only
- Top 10 screens
- AI responses in user's language
- Expand later

**Option 3:** Phase implementation
- **Phase 1:** Native language names (done!) + UserProfileScreen
- **Phase 2:** Core screens (Chat, Messages, Profile)
- **Phase 3:** AI responses in user's language
- **Phase 4:** Remaining screens

---

## ✅ What's Done So Far

- ✅ `getNativeLanguageName()` function created
- ✅ 25 languages with native script names
- ✅ Committed to repository

## 🔜 What's Next

**Immediate next task:** Update UserProfileScreen to use `getNativeLanguageName()`

**Then:** Choose an implementation option above

---

**Which option would you like me to implement?**
1. Full i18n (3-4 hours, complete solution)
2. MVP (2 hours, 3 languages, core screens)
3. Phased (1 hour at a time, gradual rollout)

Let me know and I'll continue! 🚀

