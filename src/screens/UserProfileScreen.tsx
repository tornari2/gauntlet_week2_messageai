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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../stores/authStore';
import { useNetworkStore } from '../stores/networkStore';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { firestore } from '../services/firebase';
import { Colors } from '../constants/Colors';

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

export const UserProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { isConnected } = useNetworkStore();
  
  const [displayName, setDisplayName] = useState('');
  const [selectedColor, setSelectedColor] = useState<string | null>(null); // Start with null to prevent flicker
  const [saving, setSaving] = useState(false);

  // Load user data
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      // Load color immediately (sync from cache if available)
      loadUserColor();
    }
  }, [user]);

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
      });

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

