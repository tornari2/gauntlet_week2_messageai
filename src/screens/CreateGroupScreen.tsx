/**
 * CreateGroupScreen
 * 
 * Allows users to create a group chat by selecting participants and entering a group name
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { UserSelector } from '../components/UserSelector';
import { chatService } from '../services/chatService';
import { useAuthStore } from '../stores/authStore';
import { MainStackParamList } from '../navigation/AppNavigator';
import { Colors } from '../constants/Colors';

type CreateGroupScreenNavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  'CreateGroup'
>;

interface Props {
  navigation: CreateGroupScreenNavigationProp;
}

export function CreateGroupScreen({ navigation }: Props) {
  const currentUser = useAuthStore((state) => state.user);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateGroup = async () => {
    // Validation
    if (selectedUserIds.length === 0) {
      Alert.alert('Error', 'Please select at least one participant');
      return;
    }

    if (groupName.trim().length === 0) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    if (!currentUser) {
      Alert.alert('Error', 'You must be logged in to create a group');
      return;
    }

    try {
      setLoading(true);
      
      // Create the group chat
      const chatId = await chatService.createGroupChat(
        currentUser.uid,
        selectedUserIds,
        groupName.trim()
      );

      // Navigate to the new group chat
      navigation.replace('Chat', { 
        chatId, 
        chatName: groupName.trim() 
      });
    } catch (error) {
      console.error('Error creating group:', error);
      Alert.alert('Error', 'Failed to create group. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const canCreate = selectedUserIds.length > 0 && groupName.trim().length > 0;

  if (!currentUser) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Please log in to create a group</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            testID="back-button"
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerText}>New Group</Text>
            <Text style={styles.headerSubtext}>
              {selectedUserIds.length} participant{selectedUserIds.length !== 1 ? 's' : ''} selected
            </Text>
          </View>
        </View>

      {/* Group name input */}
      <View style={styles.groupNameContainer}>
        <TextInput
          style={styles.groupNameInput}
          placeholder="Group Name"
          value={groupName}
          onChangeText={setGroupName}
          maxLength={50}
          testID="group-name-input"
        />
      </View>

      {/* User selector */}
      <View style={styles.selectorContainer}>
        <UserSelector
          currentUserId={currentUser.uid}
          selectedUserIds={selectedUserIds}
          onSelectionChange={setSelectedUserIds}
        />
      </View>

      {/* Create button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.createButton,
            (!canCreate || loading) && styles.createButtonDisabled,
          ]}
          onPress={handleCreateGroup}
          disabled={!canCreate || loading}
          testID="create-group-button"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.createButtonText}>Create Group</Text>
          )}
        </TouchableOpacity>
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  errorText: {
    fontSize: 16,
    color: '#999',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primaryDark,
  },
  backButton: {
    marginRight: 12,
    padding: 8,
  },
  backButtonText: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  groupNameContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  groupNameInput: {
    height: 44,
    fontSize: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  selectorContainer: {
    flex: 1,
  },
  buttonContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  createButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonDisabled: {
    backgroundColor: '#ccc',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

