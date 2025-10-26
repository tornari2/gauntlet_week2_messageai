/**
 * Spanish Translation File
 * Archivo de traducción al español
 */

export default {
  // Common UI elements
  common: {
    cancel: 'Cancelar',
    save: 'Guardar',
    delete: 'Eliminar',
    send: 'Enviar',
    loading: 'Cargando...',
    error: 'Error',
    ok: 'OK',
    yes: 'Sí',
    no: 'No',
    done: 'Hecho',
    close: 'Cerrar',
    retry: 'Reintentar',
    search: 'Buscar',
    create: 'Crear',
    offline: 'Sin conexión',
  },

  // Authentication
  auth: {
    signIn: 'Iniciar Sesión',
    signOut: 'Cerrar Sesión',
    signUp: 'Registrarse',
    email: 'Correo Electrónico',
    password: 'Contraseña',
    forgotPassword: '¿Olvidaste tu Contraseña?',
    resetPassword: 'Restablecer Contraseña',
    createAccount: 'Crear Cuenta',
  },

  // Chat Screen
  chat: {
    typing: 'Escribe un mensaje...',
    sending: 'Enviando...',
    deleteConfirm: '¿Eliminar este chat?',
    deleteMessage: '¿Estás seguro de que quieres eliminar este mensaje?',
    online: 'En línea',
    offline: 'Desconectado',
    lastSeen: 'Última vez',
    participants: 'participantes',
    you: 'Tú',
    delivered: 'Entregado',
    read: 'Leído',
    sent: 'Enviado',
    title: 'Chat',
    noMessages: 'No hay mensajes aún',
    startConversation: '¡Saluda!',
  },

  // Message Actions (Long Press Menu)
  messageActions: {
    title: 'Opciones de Mensaje',
    culturalContext: 'Explicar Contexto Cultural',
    explainSlang: 'Explicar Jerga',
    translate: 'Traducir',
    showOriginal: 'Mostrar Original',
    copy: 'Copiar',
    delete: 'Eliminar',
    translatedFrom: 'Traducido del',
    originallyIn: 'Originalmente en',
    messageIn: 'Mensaje en',
  },

  // Chat List Screen
  chatList: {
    title: 'Conversaciones',
    newChat: 'Nuevo Chat',
    noChats: 'No hay chats todavía',
    startChatting: 'Inicia una conversación',
    deleteChatConfirm: '¿Eliminar este chat?',
    deleteChatMessage: 'Esto eliminará permanentemente el chat y todos sus mensajes.',
  },

  // New Chat Screen
  newChat: {
    title: 'Nuevo Chat',
    selectUsers: 'Selecciona usuarios para iniciar un chat',
    groupName: 'Nombre del Grupo',
    groupNamePlaceholder: 'Ingresa el nombre del grupo...',
    createGroup: 'Crear Grupo',
    startChat: 'Iniciar Chat',
    noUsers: 'No se encontraron usuarios',
    searchUsers: 'Buscar por nombre o correo...',
    selected: 'seleccionado(s)',
    tryDifferentSearch: 'Prueba una búsqueda diferente',
    noOtherUsers: 'No hay otros usuarios disponibles',
    groupNameTitle: 'Nombra tu Grupo',
    enterGroupName: 'Ingresa el nombre del grupo',
  },

  // Profile Screen
  profile: {
    title: 'Perfil',
    displayName: 'Nombre para Mostrar',
    email: 'Correo Electrónico',
    language: 'Idioma Preferido',
    selectLanguage: 'Seleccionar Idioma',
    avatarColor: 'Color del Avatar',
    avatarColorDesc: 'Elige un color para tu avatar de perfil',
    logout: 'Cerrar Sesión',
    logoutConfirm: '¿Estás seguro de que quieres cerrar sesión?',
    editProfile: 'Editar Perfil',
    saveChanges: 'Guardar Cambios',
    changesSaved: 'Éxito',
    success: '¡Perfil actualizado correctamente!',
    offlineMode: 'Modo Sin Conexión',
    offlineChanges: 'Tu perfil se ha actualizado localmente. Los cambios se sincronizarán cuando te vuelvas a conectar a internet.',
  },

  // Auto-translate feature
  autoTranslate: {
    enabled: 'Traducción automática activada',
    disabled: 'Traducción automática desactivada',
    toggle: 'Traducción automática',
    description: 'Traducir automáticamente mensajes entrantes',
  },

  // Formality Adjustment
  formality: {
    title: 'Ajustar Formalidad',
    subtitle: 'Elige qué tan formal quieres que suene tu mensaje',
    original: 'Mensaje Original',
    select: 'Seleccionar Versión',
    casual: 'Casual',
    neutral: 'Neutral',
    formal: 'Formal',
    casualDesc: 'Amigable, relajado, conversacional',
    neutralDesc: 'Profesional pero accesible',
    formalDesc: 'Respetuoso, cortés, apropiado para negocios',
    applyChanges: 'Aplicar Cambios',
    selectVersion: 'Seleccionar una Versión',
    keepOriginal: 'Mantener Original',
    loading: 'Generando opciones de formalidad...',
    error: 'Error al ajustar la formalidad. Inténtalo de nuevo.',
  },

  // Cultural Context Modal
  culturalContext: {
    title: 'Contexto Cultural',
    loading: 'Analizando contexto cultural...',
    error: 'Error al obtener el contexto cultural',
    noContext: 'No se encontró contexto cultural',
  },

  // Slang Explanation Modal
  slang: {
    title: 'Explicación de Jerga',
    loading: 'Explicando jerga...',
    error: 'Error al explicar la jerga',
    noSlang: 'No se detectó jerga',
  },

  // Multilingual Summary Modal
  summary: {
    title: 'Resumen de Conversación',
    loading: 'Generando resumen...',
    error: 'Error al generar el resumen',
    noMessages: 'No hay mensajes para resumir',
    summarize: 'Resumir',
    share: 'Compartir en Chat',
  },

  // Read Receipt Modal
  readReceipt: {
    title: 'Información del Mensaje',
    delivered: 'Entregado a',
    read: 'Leído por',
    pending: 'Pendiente',
    at: 'a las',
  },

  // Typing Indicator
  typing: {
    isTyping: 'está escribiendo',
    areTyping: 'están escribiendo',
  },

  // Connection Status
  connection: {
    connecting: 'Conectando...',
    reconnecting: 'Reconectando...',
    offline: 'Sin conexión a internet',
    online: 'Conectado',
  },

  // Errors
  errors: {
    generic: 'Algo salió mal',
    network: 'Error de red. Por favor verifica tu conexión.',
    unauthorized: 'No estás autorizado para realizar esta acción',
    notFound: 'Contenido no encontrado',
    serverError: 'Error del servidor. Inténtalo más tarde.',
    timeout: 'Tiempo de espera agotado. Inténtalo de nuevo.',
    invalidInput: 'Entrada inválida. Por favor verifica tu entrada.',
    displayNameRequired: 'Por favor ingresa un nombre para mostrar',
  },

  // Empty States
  empty: {
    noMessages: 'No hay mensajes todavía',
    startConversation: 'Envía un mensaje para iniciar la conversación',
    noChats: 'No hay chats todavía',
    noUsers: 'No se encontraron usuarios',
    noResults: 'No se encontraron resultados',
  },

  // Notifications
  notifications: {
    newMessage: 'Nuevo mensaje',
    newMessages: 'mensajes nuevos',
    from: 'de',
  },

  // Language names (for selection)
  languages: {
    en: 'Inglés',
    es: 'Español',
    fr: 'Francés',
    de: 'Alemán',
    it: 'Italiano',
    pt: 'Portugués',
    ru: 'Ruso',
    zh: 'Chino',
    ja: 'Japonés',
    ko: 'Coreano',
    ar: 'Árabe',
    hi: 'Hindi',
    tr: 'Turco',
    pl: 'Polaco',
    nl: 'Holandés',
    sv: 'Sueco',
    da: 'Danés',
    fi: 'Finlandés',
    no: 'Noruego',
    cs: 'Checo',
    el: 'Griego',
    he: 'Hebreo',
    th: 'Tailandés',
    vi: 'Vietnamita',
    id: 'Indonesio',
  },
};

