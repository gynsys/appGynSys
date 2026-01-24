import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { chatStorage, db } from '../services/storage';
import { chatApi } from '../services/api';

const useChatStore = create((set, get) => ({
    rooms: [],
    activeRoomId: null,
    messages: {}, // Map roomId -> messages[]
    isLoading: false,

    // --- Actions ---
    setActiveRoom: async (roomId) => {
        set({ activeRoomId: roomId });
        if (roomId) {
            await get().loadMessages(roomId);
        }
    },

    loadRooms: async () => {
        set({ isLoading: true });
        try {
            // 1. Load from local DB first (Offline-first)
            const localRooms = await db.rooms.toArray();
            set({ rooms: localRooms.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)) });

            // 2. Refresh from API if online
            if (navigator.onLine) {
                const { data } = await chatApi.getRooms();
                await chatStorage.saveRooms(data);
                set({ rooms: data });

                // Auto-select first room if:
                // - There are rooms available
                // - No room is currently selected
                // - User has only one room (common for guest users)
                const currentState = get();
                if (data.length > 0 && !currentState.activeRoomId) {
                    const firstRoom = data[0];
                    set({ activeRoomId: firstRoom.id });
                    // Also load messages for this room
                    get().loadMessages(firstRoom.id);
                }
            }
        } catch (error) {
            console.error('Failed to load rooms', error);
        } finally {
            set({ isLoading: false });
        }
    },

    loadMessages: async (roomId) => {
        // Load local
        const localMessages = await chatStorage.getMessages(roomId);
        set((state) => ({
            messages: { ...state.messages, [roomId]: localMessages }
        }));

        // Load remote
        if (navigator.onLine) {
            try {
                const { data } = await chatApi.getMessages(roomId);
                await chatStorage.saveMessages(data);

                // Merge strategies could be complex, for now simple Replace/Append
                // We should re-fetch local to ensure sorted order
                const updatedLocal = await chatStorage.getMessages(roomId);
                set((state) => ({
                    messages: { ...state.messages, [roomId]: updatedLocal }
                }));
            } catch (error) {
                console.error('Failed to sync messages', error);
            }
        }
    },

    sendMessage: async (roomId, content, type = 'text', mediaUrl = null, mediaMeta = null) => {
        // ... (existing logic)
        const clientSideUuid = uuidv4();

        const optimisticMessage = {
            id: clientSideUuid, // temporary ID
            client_side_uuid: clientSideUuid,
            room_id: roomId,
            sender_id: 'me',
            content: content || (type === 'voice' ? 'Nota de voz' : 'Imagen'),
            message_type: type,
            media_url: mediaUrl,
            media_meta: mediaMeta,
            status: 'sending',
            created_at: new Date().toISOString()
        };

        // Use the new centralized action
        get().addMessage(roomId, optimisticMessage);

        // 2. Persist & Send (Logic continues...)
        await chatStorage.saveMessage(optimisticMessage);

        if (navigator.onLine) {
            try {
                const { data: sentMessage } = await chatApi.sendMessage(roomId, {
                    ...optimisticMessage,
                    roomId
                });

                // Replace in Store & DB
                await chatStorage.saveMessage(sentMessage);
                await chatStorage.db.messages.where('client_side_uuid').equals(clientSideUuid).delete();

                get().replaceMessage(roomId, clientSideUuid, sentMessage);

            } catch (error) {
                console.error('Send failed', error);
                // Handle error status
            }
        } else {
            // Offline Queue
            await chatStorage.addToQueue({
                type: 'SEND_MESSAGE',
                payload: { roomId, message: optimisticMessage }
            });
        }
    },

    // New Action for Real-time & Optimistic updates
    addMessage: (roomId, message) => {
        set((state) => {
            const roomMessages = state.messages[roomId] || [];
            // Deduplicate based on ID or ClientUUID
            if (roomMessages.some(m => m.id === message.id || m.client_side_uuid === message.client_side_uuid)) {
                return {}; // No change
            }
            return {
                messages: {
                    ...state.messages,
                    [roomId]: [...roomMessages, message]
                }
            };
        });
        // Also persist incoming real-time messages
        chatStorage.saveMessage(message);
    },

    // Helper to replace optimistic with real
    replaceMessage: (roomId, tempId, realMessage) => {
        set((state) => {
            const roomMessages = state.messages[roomId] || [];
            const updated = roomMessages.map(m =>
                (m.client_side_uuid === tempId || m.id === tempId) ? realMessage : m
            );
            return { messages: { ...state.messages, [roomId]: updated } };
        });
    },

    /**
     * Delete a room (only for doctor/owner)
     */
    deleteRoom: async (roomId) => {
        try {
            console.log('🔄 Step 1: Calling API to delete room:', roomId);

            // 1. Call API to delete room
            const response = await chatApi.deleteRoom(roomId);
            console.log('✅ Step 1 complete: API response:', response);

            console.log('🔄 Step 2: Removing from local state');

            // 2. Remove from local state
            set((state) => {
                const newRooms = state.rooms.filter(r => r.id !== roomId);
                const newMessages = Object.fromEntries(
                    Object.entries(state.messages).filter(([id]) => id !== roomId)
                );
                const newActiveRoomId = state.activeRoomId === roomId ? null : state.activeRoomId;

                console.log(`✅ Step 2 complete: ${state.rooms.length} → ${newRooms.length} rooms`);

                return {
                    rooms: newRooms,
                    messages: newMessages,
                    activeRoomId: newActiveRoomId
                };
            });

            console.log('🔄 Step 3: Removing from IndexedDB');

            // 3. Remove from IndexedDB
            await chatStorage.deleteRoom(roomId);

            console.log(`✅ Room ${roomId} deleted successfully from all sources`);
        } catch (error) {
            console.error('❌ Failed to delete room:', error);
            console.error('Error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            throw error;
        }
    }
}));

export default useChatStore;

