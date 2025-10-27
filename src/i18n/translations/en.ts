/**
 * English Translation File
 * Base language for the app
 */

export default {
  // Common UI elements
  common: {
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    send: 'Send',
    loading: 'Loading...',
    error: 'Error',
    ok: 'OK',
    yes: 'Yes',
    no: 'No',
    done: 'Done',
    close: 'Close',
    retry: 'Retry',
    search: 'Search',
    create: 'Create',
    offline: 'You are offline',
    back: 'Back',
  },

  // Authentication
  auth: {
    signIn: 'Sign In',
    signOut: 'Sign Out',
    signUp: 'Sign Up',
    email: 'Email',
    password: 'Password',
    forgotPassword: 'Forgot Password?',
    resetPassword: 'Reset Password',
    createAccount: 'Create Account',
  },

  // Chat Screen
  chat: {
    typing: 'Type a message...',
    sending: 'Sending...',
    deleteConfirm: 'Delete this chat?',
    deleteMessage: 'Are you sure you want to delete this message?',
    online: 'Online',
    offline: 'Offline',
    statusUnknown: 'Status unknown (you are offline)',
    lastSeen: 'Last seen',
    participants: 'participants',
    you: 'You',
    delivered: 'Delivered',
    read: 'Read',
    sent: 'Sent',
    title: 'Chat',
    noMessages: 'No messages yet',
    startConversation: 'Say hello!',
  },

  // Message Actions (Long Press Menu)
  messageActions: {
    title: 'Message Options',
    culturalContext: 'Explain Cultural Context',
    explainSlang: 'Explain Slang',
    translate: 'Translate',
    showOriginal: 'Show Original',
    copy: 'Copy',
    delete: 'Delete',
    translatedFrom: 'Translated from',
    originallyIn: 'Originally in',
    messageIn: 'Message in',
  },

  // Chat List Screen
  chatList: {
    title: 'Conversations',
    newChat: 'New Chat',
    noChats: 'No chats yet',
    startChatting: 'Start a conversation',
    deleteChatConfirm: 'Delete this chat?',
    deleteChatMessage: 'This will permanently delete the chat and all its messages.',
  },

  // New Chat Screen
  newChat: {
    title: 'New Chat',
    selectUsers: 'Select users to start a chat',
    groupName: 'Group Name',
    groupNamePlaceholder: 'Enter group name...',
    createGroup: 'Create Group',
    startChat: 'Start Chat',
    noUsers: 'No users found',
    searchUsers: 'Search by name or email...',
    selected: 'selected',
    tryDifferentSearch: 'Try a different search',
    noOtherUsers: 'No other users available',
    groupNameTitle: 'Name Your Group',
    enterGroupName: 'Enter group name',
  },

  // Profile Screen
  profile: {
    title: 'Profile',
    displayName: 'Display Name',
    email: 'Email',
    language: 'Preferred Language',
    selectLanguage: 'Select Language',
    avatarColor: 'Avatar Color',
    avatarColorDesc: 'Choose a color for your profile avatar',
    logout: 'Logout',
    logoutConfirm: 'Are you sure you want to logout?',
    editProfile: 'Edit Profile',
    saveChanges: 'Save Changes',
    changesSaved: 'Success',
    success: 'Profile updated successfully!',
    offlineMode: 'Offline Mode',
    offlineChanges: 'Your profile has been updated locally. Changes will sync when you reconnect to the internet.',
  },

  // Auto-translate feature
  autoTranslate: {
    enabled: 'Auto-translate enabled',
    disabled: 'Auto-translate disabled',
    toggle: 'Auto-translate',
    description: 'Automatically translate incoming messages',
  },

  // Translation Badge
  translation: {
    translating: 'Translating...',
    tapToTranslate: 'Tap to translate',
  },

  // Tone Adjustment
  formality: {
    title: 'Adjust Tone',
    subtitle: 'Choose how you want your message to sound',
    original: 'Original Message',
    select: 'Select Version',
    casual: 'Casual',
    neutral: 'Neutral',
    formal: 'Formal',
    casualDesc: 'Friendly, relaxed, conversational',
    neutralDesc: 'Polite, professional, approachable\n(free of slang or idiomatic expressions)',
    formalDesc: 'Precise, technical, academic\n(free of slang or idiomatic expressions)',
    applyChanges: 'Apply Changes',
    selectVersion: 'Select a Version',
    keepOriginal: 'Keep Original',
    loading: 'Generating tone options...',
    error: 'Failed to adjust tone. Please try again.',
  },

  // Cultural Context Modal
  culturalContext: {
    title: 'Cultural Context',
    loading: 'Analyzing cultural context...',
    error: 'Failed to get cultural context',
    noContext: 'No specific cultural context detected',
    message: 'Message',
    language: 'Language',
    insights: 'Cultural Insights',
    references: 'References',
  },

  // Slang Explanation Modal
  slang: {
    title: 'Slang Explanation',
    loading: 'Explaining slang...',
    error: 'Failed to explain slang',
    noSlang: 'No slang detected',
    standardLanguage: 'This message uses standard language.',
    found: 'slang/idiom(s) found',
    literal: 'Literal',
    meaning: 'Meaning',
    example: 'Example',
  },

  // Multilingual Summary Modal
  summary: {
    title: 'Conversation Summary',
    loading: 'Generating summary...',
    error: 'Failed to generate summary',
    noMessages: 'No messages to summarize',
    summarize: 'Summarize',
    share: 'Share to Chat',
  },

  // Read Receipt Modal
  readReceipt: {
    title: 'Message Info',
    delivered: 'Delivered to',
    read: 'Read by',
    pending: 'Pending',
    at: 'at',
  },

  // Typing Indicator
  typing: {
    isTyping: 'is typing',
    areTyping: 'are typing',
  },

  // Connection Status
  connection: {
    connecting: 'Connecting...',
    reconnecting: 'Reconnecting...',
    offline: 'No internet connection',
    online: 'Connected',
  },

  // Errors
  errors: {
    generic: 'Something went wrong',
    network: 'Network error. Please check your connection.',
    unauthorized: 'You are not authorized to perform this action',
    notFound: 'Content not found',
    serverError: 'Server error. Please try again later.',
    timeout: 'Request timed out. Please try again.',
    invalidInput: 'Invalid input. Please check your entry.',
    displayNameRequired: 'Please enter a display name',
    languageUnknown: 'Language Unknown',
    languageUnknownMessage: 'Unable to identify the language of this message. AI features require recognizable text in a supported language.',
    untranslatableText: 'This text cannot be analyzed because its language is unknown or undefined.',
  },

  // Empty States
  empty: {
    noMessages: 'No messages yet',
    startConversation: 'Send a message to start the conversation',
    noChats: 'No chats yet',
    noUsers: 'No users found',
    noResults: 'No results found',
  },

  // Notifications
  notifications: {
    newMessage: 'New message',
    newMessages: 'new messages',
    from: 'from',
  },

  // Language names (for selection)
  languages: {
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    it: 'Italian',
    pt: 'Portuguese',
    ru: 'Russian',
    zh: 'Chinese',
    ja: 'Japanese',
    ko: 'Korean',
    ar: 'Arabic',
    hi: 'Hindi',
    tr: 'Turkish',
    pl: 'Polish',
    nl: 'Dutch',
    sv: 'Swedish',
    da: 'Danish',
    fi: 'Finnish',
    no: 'Norwegian',
    cs: 'Czech',
    el: 'Greek',
    he: 'Hebrew',
    th: 'Thai',
    vi: 'Vietnamese',
    id: 'Indonesian',
    unknown: 'Unknown',
  },

  // Last Seen Timestamps
  lastSeen: {
    justNow: 'Active just now',
    minutesAgo: 'Active {{minutes}}m ago',
    hoursAgo: 'Active {{hours}}h ago',
    yesterday: 'Active yesterday',
    daysAgo: 'Active {{days}} days ago',
    aWhileAgo: 'Active a while ago',
  },
};

