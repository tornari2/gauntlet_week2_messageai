/**
 * UserProfileScreen
 * 
 * User profile page where users can:
 * - Change their display name
 * - Choose their avatar color
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../stores/authStore';
import { useNetworkStore } from '../stores/networkStore';
import { useTranslationStore } from '../stores/translationStore';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { firestore } from '../services/firebase';
import { Colors } from '../constants/Colors';
import { COMMON_LANGUAGES, getNativeLanguageName } from '../services/languageService';
import i18n from '../i18n';

const AVATAR_COLORS = [
  { name: 'Green', value: '#25D366' },
  { name: 'Blue', value: '#4FC3F7' },
  { name: 'Purple', value: '#9C27B0' },
  { name: 'Red', value: '#F44336' },
  { name: 'Orange', value: '#FF9800' },
  { name: 'Pink', value: '#E91E63' },
  { name: 'Teal', value: '#009688' },
  { name: 'Indigo', value: '#3F51B5' },
  { name: 'Amber', value: '#FFC107' },
  { name: 'Deep Purple', value: '#673AB7' },
  { name: 'Cyan', value: '#00BCD4' },
  { name: 'Lime', value: '#CDDC39' },
];

// Helper function to get flag emoji for language
const getLanguageFlag = (languageCode: string): string => {
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
  };
  return flags[languageCode] || '🌐';
};

export const UserProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { isConnected } = useNetworkStore();
  const translationStore = useTranslationStore();
  
  const [displayName, setDisplayName] = useState('');
  const [selectedColor, setSelectedColor] = useState<string | null>(null); // Start with null to prevent flicker
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load user data
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      // Load color immediately (sync from cache if available)
      loadUserColor();
      // Load language preference
      loadUserLanguage();
    }
  }, [user]);

  const loadUserLanguage = async () => {
    if (!user) return;
    
    try {
      await translationStore.loadUserLanguage(user.uid);
      setSelectedLanguage(translationStore.userLanguage);
    } catch (error) {
      console.error('Error loading user language:', error);
      setSelectedLanguage('en'); // Default to English
    }
  };

  const loadUserColor = async () => {
    if (!user) return;
    
    // Try to load from cache first (fast, prevents flicker)
    try {
      const { getCachedUserProfile } = await import('../services/storageService');
      const cachedUser = await getCachedUserProfile(user.uid);
      
      if (cachedUser?.avatarColor) {
        setSelectedColor(cachedUser.avatarColor);
      } else {
        // Set default if no cache
        setSelectedColor('#25D366');
      }
    } catch (error) {
      console.error('Error loading cached color:', error);
      setSelectedColor('#25D366');
    }
    
    // Then load from Firestore (may update if changed)
    try {
      const userRef = doc(firestore, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data.avatarColor) {
          setSelectedColor(data.avatarColor);
          
          // Update cache with latest color
          try {
            const { cacheUserProfiles } = await import('../services/storageService');
            await cacheUserProfiles([{
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL || null,
              avatarColor: data.avatarColor,
              isOnline: data.isOnline || false,
              lastSeen: data.lastSeen?.toDate ? data.lastSeen.toDate() : new Date(),
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
            }]);
          } catch (cacheError) {
            console.error('Error caching updated color:', cacheError);
          }
        }
      }
    } catch (error: any) {
      // Only log non-offline errors
      if (error?.code !== 'unavailable' && 
          !error?.message?.includes('offline') &&
          !error?.message?.includes('load bundle')) {
        console.error('Error loading user color from Firestore:', error);
      }
      // Keep the cached color or default
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    // Validation
    if (!displayName.trim()) {
      Alert.alert('Error', 'Please enter a display name');
      return;
    }

    // If offline, update UI immediately and show message
    if (!isConnected) {
      // Update local auth store immediately for instant UI update
      useAuthStore.setState({
        user: {
          ...user,
          displayName: displayName.trim(),
        },
      });
      
      // Update cache with new color
      try {
        const { cacheUserProfiles } = await import('../services/storageService');
        await cacheUserProfiles([{
          uid: user.uid,
          email: user.email,
          displayName: displayName.trim(),
          photoURL: user.photoURL || null,
          avatarColor: selectedColor || undefined,
          isOnline: user.isOnline,
          lastSeen: user.lastSeen || new Date(),
          createdAt: user.createdAt || new Date(),
        }]);
        console.log('✅ Cached updated profile offline');
      } catch (cacheError) {
        console.error('Error caching updated profile:', cacheError);
      }

      Alert.alert(
        'Offline Mode', 
        'Your profile has been updated locally. Changes will sync when you reconnect to the internet.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
      
      // Queue the update for when we're back online (Firestore handles this automatically)
      try {
        const userRef = doc(firestore, 'users', user.uid);
        await updateDoc(userRef, {
          displayName: displayName.trim(),
          avatarColor: selectedColor,
        });
      } catch (error) {
        // Firestore will queue this write and sync when online
        console.log('Profile update queued for when online');
      }
      
      return;
    }

    // Online - save normally
    setSaving(true);
    try {
      const userRef = doc(firestore, 'users', user.uid);
      await updateDoc(userRef, {
        displayName: displayName.trim(),
        avatarColor: selectedColor,
        preferredLanguage: selectedLanguage,
      });

      // Update translation store
      await translationStore.setUserLanguage(selectedLanguage, user.uid);

      // Update local auth store
      useAuthStore.setState({
        user: {
          ...user,
          displayName: displayName.trim(),
        },
      });
      
      // Update cache with new color for immediate offline access
      try {
        const { cacheUserProfiles } = await import('../services/storageService');
        await cacheUserProfiles([{
          uid: user.uid,
          email: user.email,
          displayName: displayName.trim(),
          photoURL: user.photoURL || null,
          avatarColor: selectedColor || undefined,
          isOnline: user.isOnline,
          lastSeen: user.lastSeen || new Date(),
          createdAt: user.createdAt || new Date(),
        }]);
        console.log('✅ Cached updated profile online');
      } catch (cacheError) {
        console.error('Error caching updated profile:', cacheError);
      }

      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            testID="back-button"
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
        >
          {/* Avatar Preview */}
          <View style={styles.avatarSection}>
            <View 
              style={[
                styles.avatarPreview, 
                { backgroundColor: selectedColor || '#25D366' }
              ]}
            >
              <Text style={styles.avatarText}>
                {displayName.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
            <Text style={styles.emailText}>{user?.email}</Text>
          </View>

          {/* Display Name */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Display Name</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Enter your name"
              placeholderTextColor="#999"
              maxLength={50}
              testID="display-name-input"
            />
          </View>

          {/* Preferred Language */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🌐 Preferred Language</Text>
            <Text style={styles.sectionSubtitle}>
              Messages in other languages will be translated to your preferred language
            </Text>
            
            <TouchableOpacity
              style={styles.languageDropdown}
              onPress={() => setShowLanguagePicker(true)}
              testID="language-dropdown"
            >
              <View style={styles.languageDropdownContent}>
                <Text style={styles.languageDropdownFlag}>
                  {getLanguageFlag(selectedLanguage)}
                </Text>
                <Text style={styles.languageDropdownText}>
                  {getNativeLanguageName(selectedLanguage)}
                </Text>
              </View>
              <Text style={styles.languageDropdownArrow}>▼</Text>
            </TouchableOpacity>
          </View>

          {/* Avatar Color */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Avatar Color</Text>
            <Text style={styles.sectionSubtitle}>
              Choose a color for your profile avatar
            </Text>
            
            <View style={styles.colorGrid}>
              {AVATAR_COLORS.map((color) => (
                <TouchableOpacity
                  key={color.value}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color.value },
                    selectedColor === color.value && styles.colorOptionSelected,
                  ]}
                  onPress={() => setSelectedColor(color.value)}
                  testID={`color-${color.name}`}
                >
                  {selectedColor === color.value && (
                    <Text style={styles.colorCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
            testID="save-button"
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </ScrollView>

        {/* Language Picker Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={showLanguagePicker}
          onRequestClose={() => setShowLanguagePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Language</Text>
                <TouchableOpacity
                  onPress={() => setShowLanguagePicker(false)}
                  style={styles.modalCloseButton}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalScrollView}>
                {COMMON_LANGUAGES.map((language) => (
                  <TouchableOpacity
                    key={language.code}
                    style={[
                      styles.modalLanguageOption,
                      selectedLanguage === language.code && styles.modalLanguageOptionSelected,
                    ]}
                    onPress={() => {
                      setSelectedLanguage(language.code);
                      setShowLanguagePicker(false);
                    }}
                    testID={`language-${language.code}`}
                  >
                    <Text style={styles.modalLanguageFlag}>
                      {getLanguageFlag(language.code)}
                    </Text>
                    <Text style={[
                      styles.modalLanguageText,
                      selectedLanguage === language.code && styles.modalLanguageTextSelected
                    ]}>
                      {getNativeLanguageName(language.code)}
                    </Text>
                    {selectedLanguage === language.code && (
                      <Text style={styles.modalLanguageCheck}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primaryDark,
  },
  backButton: {
    padding: 8,
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerRight: {
    width: 60,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
    paddingVertical: 20,
  },
  avatarPreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emailText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#000',
  },
  colorCheck: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  languageDropdown: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  languageDropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  languageDropdownFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  languageDropdownText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  languageDropdownArrow: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalCloseText: {
    fontSize: 24,
    color: '#8E8E93',
    fontWeight: '300',
  },
  modalScrollView: {
    paddingHorizontal: 20,
  },
  modalLanguageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  modalLanguageOptionSelected: {
    backgroundColor: '#F0EDE6',
  },
  modalLanguageFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  modalLanguageText: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  modalLanguageTextSelected: {
    fontWeight: '600',
    color: Colors.primaryDark,
  },
  modalLanguageCheck: {
    fontSize: 18,
    color: Colors.primary,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

