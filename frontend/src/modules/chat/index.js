/**
 * @module @gynsys/chat
 * @description Módulo de Chat portable y multi-tenant para aplicaciones React.
 * Diseñado para ser "plug and play" en cualquier proyecto.
 * 
 * @example
 * // Uso básico - importar el widget completo
 * import { ChatWidget } from '@/modules/chat';
 * 
 * function Dashboard() {
 *   return <ChatWidget className="h-[600px]" />;
 * }
 * 
 * @example
 * // Uso avanzado - importar componentes individuales
 * import { 
 *   PatientChatFloatingButton, 
 *   useChatStore, 
 *   chatApi 
 * } from '@/modules/chat';
 * 
 * @example
 * // Uso del store fuera del widget
 * import { useChatStore } from '@/modules/chat';
 * 
 * function NotificationBadge() {
 *   const unreadCount = useChatStore(state => 
 *     Object.values(state.rooms).filter(r => r.unread_count > 0).length
 *   );
 *   return <span>{unreadCount}</span>;
 * }
 */

// ============================================================================
// COMPONENTS
// ============================================================================

/**
 * Widget principal de chat con sidebar de rooms y área de mensajes.
 * Incluye soporte para texto, imágenes, y notas de voz.
 * @component
 */
export { default as ChatWidget } from './components/ChatWidget';

/**
 * Botón flotante para iniciar chat desde perfil público del doctor.
 * Incluye flujo de login de invitado.
 * @component
 */
export { default as PatientChatFloatingButton } from './components/PatientChatFloatingButton';

/**
 * Burbuja individual de mensaje con soporte para diferentes tipos de contenido.
 * @component
 */
export { default as MessageBubble } from './components/MessageBubble';

/**
 * Área de entrada con soporte para texto, adjuntos y grabación de audio.
 * @component
 */
export { default as InputArea } from './components/InputArea';

/**
 * Reproductor de audio para notas de voz con controles de play/pause y progreso.
 * @component
 */
export { default as AudioPlayer } from './components/AudioPlayer';

/**
 * Avatar component with user initials in colored circle.
 * @component
 */
export { default as Avatar } from './components/Avatar';

// ============================================================================
// STATE MANAGEMENT (Zustand)
// ============================================================================

/**
 * Store de Zustand para el estado global del chat.
 * Maneja rooms, messages, y la cola offline.
 * 
 * @example
 * const { rooms, activeRoomId, sendMessage } = useChatStore();
 * 
 * @example
 * // Selector optimizado
 * const messages = useChatStore(state => state.messages[roomId]);
 */
export { default as useChatStore } from './context/useChatStore';

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook que inicializa la sincronización en tiempo real via Socket.IO.
 * Conecta al servidor, maneja reconexiones, y procesa la cola offline.
 * 
 * @example
 * function ChatContainer() {
 *   useChatSync(); // Solo llamar una vez en el componente raíz
 *   return <ChatWidget />;
 * }
 */
export { default as useChatSync } from './hooks/useChatSync';

/**
 * Hook para grabar audio usando MediaRecorder API.
 * Retorna estado de grabación y blob de audio.
 * 
 * @returns {{ isRecording, audioBlob, startRecording, stopRecording, resetAudio }}
 */
export { default as useAudioRecorder } from './hooks/useAudioRecorder';

// ============================================================================
// SERVICES
// ============================================================================

/**
 * Cliente API para endpoints del chat.
 * Pre-configurado con autenticación JWT.
 * 
 * @example
 * const { data } = await chatApi.getRooms();
 * const { data: { uploadUrl } } = await chatApi.getPresignedUrl('audio.webm', 'audio/webm');
 */
export { chatApi } from './services/api';

/**
 * Servicio de persistencia local usando IndexedDB (Dexie).
 * Almacena rooms, messages, y cola offline para funcionalidad offline-first.
 * 
 * @example
 * await chatStorage.saveMessage(message);
 * const messages = await chatStorage.getMessages(roomId);
 */
export { chatStorage, db as chatDb } from './services/storage';

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

/**
 * Export por defecto: ChatWidget para uso simple.
 * @default
 */
export { default } from './components/ChatWidget';

// ============================================================================
// TYPE DEFINITIONS (JSDoc for IDE support)
// ============================================================================

/**
 * @typedef {Object} ChatRoom
 * @property {string} id - UUID del room
 * @property {string} tenant_id - ID del tenant/doctor
 * @property {'direct'|'group'} type - Tipo de conversación
 * @property {Object} metadata - Datos adicionales (subject, labels)
 * @property {string} created_at - ISO timestamp
 * @property {string} updated_at - ISO timestamp
 */

/**
 * @typedef {Object} ChatMessage
 * @property {string} id - UUID del mensaje
 * @property {string} room_id - UUID del room
 * @property {string} sender_id - UUID del remitente
 * @property {string} client_side_uuid - UUID generado en cliente (idempotencia)
 * @property {string} content - Contenido del mensaje
 * @property {'text'|'image'|'voice'|'file'} message_type - Tipo de contenido
 * @property {string} [media_url] - URL del archivo multimedia
 * @property {Object} [media_meta] - Metadata (duration, waveform, size)
 * @property {'sending'|'sent'|'delivered'|'read'} status - Estado del mensaje
 * @property {string} created_at - ISO timestamp
 */

/**
 * @typedef {Object} ChatStoreState
 * @property {Object.<string, ChatRoom>} rooms - Rooms indexados por ID
 * @property {string|null} activeRoomId - Room actualmente seleccionado
 * @property {Object.<string, ChatMessage[]>} messages - Mensajes por roomId
 * @property {boolean} isLoading - Indica si hay una operación en curso
 * @property {Function} loadRooms - Carga los rooms del servidor
 * @property {Function} setActiveRoom - Selecciona un room
 * @property {Function} sendMessage - Envía un mensaje
 * @property {Function} addMessage - Agrega un mensaje (desde socket)
 */
