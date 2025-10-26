/**
 * French Translation File
 * Fichier de traduction français
 */

export default {
  // Common UI elements
  common: {
    cancel: 'Annuler',
    save: 'Enregistrer',
    delete: 'Supprimer',
    send: 'Envoyer',
    loading: 'Chargement...',
    error: 'Erreur',
    ok: 'OK',
    yes: 'Oui',
    no: 'Non',
    done: 'Terminé',
    close: 'Fermer',
    retry: 'Réessayer',
    search: 'Rechercher',
    create: 'Créer',
    offline: 'Hors ligne',
  },

  // Authentication
  auth: {
    signIn: 'Se Connecter',
    signOut: 'Se Déconnecter',
    signUp: "S'inscrire",
    email: 'Email',
    password: 'Mot de Passe',
    forgotPassword: 'Mot de passe oublié?',
    resetPassword: 'Réinitialiser le Mot de Passe',
    createAccount: 'Créer un Compte',
  },

  // Chat Screen
  chat: {
    typing: 'Tapez un message...',
    sending: 'Envoi...',
    deleteConfirm: 'Supprimer cette conversation?',
    deleteMessage: 'Êtes-vous sûr de vouloir supprimer ce message?',
    online: 'En ligne',
    offline: 'Hors ligne',
    lastSeen: 'Vu pour la dernière fois',
    participants: 'participants',
    you: 'Vous',
    delivered: 'Livré',
    read: 'Lu',
    sent: 'Envoyé',
    title: 'Discussion',
    noMessages: 'Aucun message pour le moment',
    startConversation: 'Dites bonjour!',
  },

  // Message Actions (Long Press Menu)
  messageActions: {
    title: 'Options du Message',
    culturalContext: 'Expliquer le Contexte Culturel',
    explainSlang: 'Expliquer l\'Argot',
    translate: 'Traduire',
    showOriginal: 'Afficher l\'Original',
    copy: 'Copier',
    delete: 'Supprimer',
    translatedFrom: 'Traduit de',
    originallyIn: 'Originalement en',
    messageIn: 'Message en',
  },

  // Chat List Screen
  chatList: {
    title: 'Conversations',
    newChat: 'Nouvelle Conversation',
    noChats: 'Aucune conversation',
    startChatting: 'Commencer une conversation',
    deleteChatConfirm: 'Supprimer cette conversation?',
    deleteChatMessage: 'Cela supprimera définitivement la conversation et tous ses messages.',
  },

  // New Chat Screen
  newChat: {
    title: 'Nouvelle Conversation',
    selectUsers: 'Sélectionnez des utilisateurs pour commencer',
    groupName: 'Nom du Groupe',
    groupNamePlaceholder: 'Entrez le nom du groupe...',
    createGroup: 'Créer un Groupe',
    startChat: 'Commencer',
    noUsers: 'Aucun utilisateur trouvé',
    searchUsers: 'Rechercher par nom ou email...',
    selected: 'sélectionné(s)',
    tryDifferentSearch: 'Essayez une autre recherche',
    noOtherUsers: 'Aucun autre utilisateur disponible',
    groupNameTitle: 'Nommez votre Groupe',
    enterGroupName: 'Entrez le nom du groupe',
  },

  // Profile Screen
  profile: {
    title: 'Profil',
    displayName: 'Nom d\'Affichage',
    email: 'Email',
    language: 'Langue Préférée',
    selectLanguage: 'Sélectionner la Langue',
    avatarColor: 'Couleur de l\'Avatar',
    avatarColorDesc: 'Choisissez une couleur pour votre avatar de profil',
    logout: 'Se Déconnecter',
    logoutConfirm: 'Êtes-vous sûr de vouloir vous déconnecter?',
    editProfile: 'Modifier le Profil',
    saveChanges: 'Enregistrer',
    changesSaved: 'Succès',
    success: 'Profil mis à jour avec succès!',
    offlineMode: 'Mode Hors Ligne',
    offlineChanges: 'Votre profil a été mis à jour localement. Les modifications seront synchronisées lorsque vous vous reconnecterez à internet.',
  },

  // Auto-translate feature
  autoTranslate: {
    enabled: 'Traduction automatique activée',
    disabled: 'Traduction automatique désactivée',
    toggle: 'Traduction automatique',
    description: 'Traduire automatiquement les messages entrants',
  },

  // Formality Adjustment
  formality: {
    title: 'Ajuster la Formalité',
    subtitle: 'Choisissez le niveau de formalité de votre message',
    original: 'Message Original',
    select: 'Sélectionner la Version',
    casual: 'Décontracté',
    neutral: 'Neutre',
    formal: 'Formel',
    casualDesc: 'Amical, détendu, conversationnel',
    neutralDesc: 'Professionnel mais accessible',
    formalDesc: 'Respectueux, poli, adapté aux affaires',
    applyChanges: 'Appliquer les Modifications',
    selectVersion: 'Sélectionner une Version',
    keepOriginal: 'Garder l\'Original',
    loading: 'Génération des options de formalité...',
    error: 'Échec de l\'ajustement de la formalité. Réessayez.',
  },

  // Cultural Context Modal
  culturalContext: {
    title: 'Contexte Culturel',
    loading: 'Analyse du contexte culturel...',
    error: 'Échec de l\'obtention du contexte culturel',
    noContext: 'Aucun contexte culturel trouvé',
  },

  // Slang Explanation Modal
  slang: {
    title: 'Explication de l\'Argot',
    loading: 'Explication de l\'argot...',
    error: 'Échec de l\'explication de l\'argot',
    noSlang: 'Aucun argot détecté',
  },

  // Multilingual Summary Modal
  summary: {
    title: 'Résumé de Conversation',
    loading: 'Génération du résumé...',
    error: 'Échec de la génération du résumé',
    noMessages: 'Aucun message à résumer',
    summarize: 'Résumer',
    share: 'Partager dans le Chat',
  },

  // Read Receipt Modal
  readReceipt: {
    title: 'Informations du Message',
    delivered: 'Livré à',
    read: 'Lu par',
    pending: 'En attente',
    at: 'à',
  },

  // Typing Indicator
  typing: {
    isTyping: 'est en train d\'écrire',
    areTyping: 'sont en train d\'écrire',
  },

  // Connection Status
  connection: {
    connecting: 'Connexion...',
    reconnecting: 'Reconnexion...',
    offline: 'Pas de connexion internet',
    online: 'Connecté',
  },

  // Errors
  errors: {
    generic: 'Quelque chose s\'est mal passé',
    network: 'Erreur réseau. Vérifiez votre connexion.',
    unauthorized: 'Vous n\'êtes pas autorisé à effectuer cette action',
    notFound: 'Contenu non trouvé',
    serverError: 'Erreur serveur. Réessayez plus tard.',
    timeout: 'Délai d\'attente dépassé. Réessayez.',
    invalidInput: 'Entrée invalide. Vérifiez votre saisie.',
    displayNameRequired: 'Veuillez entrer un nom d\'affichage',
  },

  // Empty States
  empty: {
    noMessages: 'Aucun message',
    startConversation: 'Envoyez un message pour commencer la conversation',
    noChats: 'Aucune conversation',
    noUsers: 'Aucun utilisateur trouvé',
    noResults: 'Aucun résultat trouvé',
  },

  // Notifications
  notifications: {
    newMessage: 'Nouveau message',
    newMessages: 'nouveaux messages',
    from: 'de',
  },

  // Language names (for selection)
  languages: {
    en: 'Anglais',
    es: 'Espagnol',
    fr: 'Français',
    de: 'Allemand',
    it: 'Italien',
    pt: 'Portugais',
    ru: 'Russe',
    zh: 'Chinois',
    ja: 'Japonais',
    ko: 'Coréen',
    ar: 'Arabe',
    hi: 'Hindi',
    tr: 'Turc',
    pl: 'Polonais',
    nl: 'Néerlandais',
    sv: 'Suédois',
    da: 'Danois',
    fi: 'Finnois',
    no: 'Norvégien',
    cs: 'Tchèque',
    el: 'Grec',
    he: 'Hébreu',
    th: 'Thaï',
    vi: 'Vietnamien',
    id: 'Indonésien',
  },
};

