# AI Assistant with RAG + Function Calling - Setup Instructions

## Prerequisites

1. **Pinecone Account** (for vector database)
   - Sign up at: https://www.pinecone.io/
   - Free tier available (good for testing)

## Setup Steps

### 1. Install Dependencies

```bash
# Install backend dependencies
cd functions
npm install

# Install frontend dependencies
cd ..
npm install
```

### 2. Configure Pinecone

1. Create a Pinecone account at https://www.pinecone.io/
2. Create a new index with these settings:
   - **Name**: `message-ai-conversations`
   - **Dimensions**: `1536` (for OpenAI text-embedding-3-small)
   - **Metric**: `cosine`
   - **Pod Type**: `p1.x1` (or starter for free tier)

3. Get your API key from the Pinecone console

### 3. Configure Environment Variables

**For local development (Firebase Emulator):**

Create `functions/.env` file:
```bash
OPENAI_API_KEY=sk-your-openai-api-key
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_INDEX_NAME=message-ai-conversations
```

**For production (Firebase):**

```bash
# Set OpenAI API key (if not already set)
firebase functions:config:set openai.key="sk-your-openai-api-key"

# Set Pinecone configuration
firebase functions:config:set pinecone.api_key="your-pinecone-api-key"
firebase functions:config:set pinecone.index_name="message-ai-conversations"
```

### 4. Deploy Firebase Functions

```bash
cd functions
npm run build
firebase deploy --only functions
```

This will deploy:
- `intelligentChatAssistant` - Main AI assistant function
- `indexNewMessage` - Background trigger to index messages
- All existing translation functions

### 5. Grant Permissions (iOS/Android)

The app needs permission to save images to the photo library.

**iOS**: Already configured in Info.plist
**Android**: Permission will be requested at runtime

## Usage

### Example Queries

1. **General Summary**:
   - "Summarize this conversation"
   - "Give me an overview of our chat"

2. **Date-based Queries**:
   - "What did we discuss last week?"
   - "Show me messages from yesterday"
   - "Summarize our conversation since Monday"

3. **Participant-specific**:
   - "What did John say about the project?"
   - "Summarize Sarah's messages"

4. **Action Items & Dates**:
   - "Show me action items"
   - "List all important dates mentioned"
   - "What are the deadlines we discussed?"

5. **Tone Analysis**:
   - "Analyze the tone of our conversation"
   - "How is the mood of this chat?"

6. **Topic-specific**:
   - "What did we say about the budget?"
   - "Summarize discussions about travel plans"

### Features

- **RAG (Retrieval-Augmented Generation)**: Semantic search over conversation history
- **Function Calling**: LLM autonomously calls appropriate tools
- **Date Parsing**: Understands relative dates ("last Thursday") and absolute dates ("February 5th")
- **Structured Output**: Action items, important dates, tone analysis
- **Image Export**: Save results as styled images to photos

## Cost Considerations

### OpenAI API Costs

- **text-embedding-3-small**: $0.020 / 1M tokens
- **gpt-4o-mini**: $0.150 / 1M input tokens, $0.600 / 1M output tokens

**Estimated costs per 1000 messages indexed**:
- Embeddings: ~$0.02
- AI queries: $0.05 - $0.15 per query (depending on complexity)

### Pinecone Costs

- **Free tier**: 1 pod, good for testing
- **Starter**: ~$70/month for production

## Troubleshooting

### "Pinecone API key not configured"

Make sure you've set the environment variables correctly:
- For local: `functions/.env` file
- For production: `firebase functions:config:set`

### "Index not found"

Create the Pinecone index with the correct name and dimensions.

### "Permission denied" for photos

Request permission in the app settings:
- iOS: Settings → MessageAI → Photos
- Android: App permissions → Storage

### Messages not being indexed

Check Firebase Functions logs:
```bash
firebase functions:log
```

Look for "Successfully indexed message" or error messages.

## Architecture

```
User Query → AI Assistant Function
              ↓
         Function Calling Loop
              ↓
         ┌─────────────────┐
         │  RAG Services   │
         │  - Semantic     │
         │    Search       │
         │  - Date Range   │
         │    Filter       │
         │  - Participant  │
         │    Filter       │
         └─────────────────┘
              ↓
         LLM Synthesis
              ↓
         Structured Output
         (Summary, Actions,
          Dates, Tone)
```

## Support

For issues or questions:
1. Check Firebase Functions logs
2. Check Pinecone console for index stats
3. Verify OpenAI API key has sufficient credits

