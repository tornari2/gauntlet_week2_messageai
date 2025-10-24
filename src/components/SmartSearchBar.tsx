/**
 * Smart Search Bar Component
 * Semantic search powered by RAG (Pinecone + OpenAI)
 */

import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  FlatList,
  Text,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAIStore } from '../stores/aiStore';
import { SearchResult } from '../types/ai';

interface SmartSearchBarProps {
  chatId: string;
  onMessageSelect?: (messageId: string) => void;
}

export function SmartSearchBar({ chatId, onMessageSelect }: SmartSearchBarProps) {
  const [query, setQuery] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [answer, setAnswer] = useState<string | undefined>();
  
  const { search, loading, errors } = useAIStore();
  const isSearching = loading.smartSearch;
  
  const handleSearch = async () => {
    if (!query.trim()) {
      return;
    }
    
    setIsModalVisible(true);
    
    try {
      const response = await search(query, chatId);
      setSearchResults(response.results);
      setAnswer(response.answer);
    } catch (error) {
      console.error('Search error:', error);
      // Error is handled by the store
    }
  };
  
  const handleClear = () => {
    setQuery('');
    setSearchResults([]);
    setAnswer(undefined);
    setIsModalVisible(false);
  };
  
  const handleMessagePress = (messageId: string) => {
    setIsModalVisible(false);
    onMessageSelect?.(messageId);
  };
  
  return (
    <>
      {/* Search Bar */}
      <View style={styles.container}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#666" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Smart search messages..."
            placeholderTextColor="#999"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            onPress={handleSearch} 
            style={styles.searchButton}
            disabled={!query.trim() || isSearching}
          >
            {isSearching ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Ionicons name="arrow-forward-circle" size={24} color="#007AFF" />
            )}
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Search Results Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleClear}
      >
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Search Results</Text>
            <TouchableOpacity onPress={handleClear}>
              <Ionicons name="close" size={28} color="#007AFF" />
            </TouchableOpacity>
          </View>
          
          {/* Query */}
          <View style={styles.queryContainer}>
            <Text style={styles.queryLabel}>Searching for:</Text>
            <Text style={styles.queryText}>{query}</Text>
          </View>
          
          {/* Loading */}
          {isSearching && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Searching messages...</Text>
            </View>
          )}
          
          {/* Error */}
          {errors.smartSearch && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={24} color="#FF3B30" />
              <Text style={styles.errorText}>
                {errors.smartSearch.message || 'Search failed. Try again.'}
              </Text>
            </View>
          )}
          
          {/* AI Answer */}
          {answer && !isSearching && (
            <View style={styles.answerContainer}>
              <View style={styles.answerHeader}>
                <Ionicons name="bulb" size={20} color="#FF9500" />
                <Text style={styles.answerLabel}>AI Answer</Text>
              </View>
              <Text style={styles.answerText}>{answer}</Text>
            </View>
          )}
          
          {/* Results */}
          {!isSearching && searchResults.length > 0 && (
            <>
              <Text style={styles.resultsHeader}>
                Found {searchResults.length} relevant message{searchResults.length !== 1 ? 's' : ''}
              </Text>
              <FlatList
                data={searchResults}
                keyExtractor={(item) => item.messageId}
                renderItem={({ item }) => (
                  <SearchResultItem 
                    result={item} 
                    onPress={() => handleMessagePress(item.messageId)} 
                  />
                )}
                contentContainerStyle={styles.resultsList}
              />
            </>
          )}
          
          {/* No Results */}
          {!isSearching && searchResults.length === 0 && !errors.smartSearch && (
            <View style={styles.emptyContainer}>
              <Ionicons name="search" size={64} color="#CCC" />
              <Text style={styles.emptyText}>No results found</Text>
              <Text style={styles.emptySubtext}>Try a different search query</Text>
            </View>
          )}
        </View>
      </Modal>
    </>
  );
}

/**
 * Search Result Item Component
 */
interface SearchResultItemProps {
  result: SearchResult;
  onPress: () => void;
}

function SearchResultItem({ result, onPress }: SearchResultItemProps) {
  const relevancePercent = Math.round(result.relevanceScore * 100);
  
  return (
    <Pressable 
      style={({ pressed }) => [
        styles.resultItem,
        pressed && styles.resultItemPressed
      ]}
      onPress={onPress}
    >
      <View style={styles.resultHeader}>
        <Text style={styles.resultSender}>{result.senderName || 'Unknown'}</Text>
        <View style={styles.relevanceBadge}>
          <Text style={styles.relevanceText}>{relevancePercent}%</Text>
        </View>
      </View>
      <Text style={styles.resultText} numberOfLines={3}>
        {result.text}
      </Text>
      <Text style={styles.resultTimestamp}>
        {result.timestamp.toLocaleString()}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#F8F8F8',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  clearButton: {
    padding: 4,
  },
  searchButton: {
    marginLeft: 8,
    padding: 4,
  },
  
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  queryContainer: {
    padding: 16,
    backgroundColor: '#F8F8F8',
  },
  queryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  queryText: {
    fontSize: 16,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    margin: 16,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
  },
  errorText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#C62828',
  },
  answerContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  answerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  answerLabel: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E65100',
  },
  answerText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
  },
  resultsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    backgroundColor: '#F8F8F8',
  },
  resultsList: {
    paddingBottom: 16,
  },
  resultItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  resultItemPressed: {
    backgroundColor: '#F0F0F0',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultSender: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  relevanceBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  relevanceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2E7D32',
  },
  resultText: {
    fontSize: 15,
    lineHeight: 20,
    color: '#333',
    marginBottom: 8,
  },
  resultTimestamp: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
});

