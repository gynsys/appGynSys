import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import useChatStore from '../context/useChatStore';
import { chatStorage } from '../services/storage';
import { chatApi } from '../services/api';

const useChatSync = () => {
    const socketRef = useRef(null);
    const { addMessage, activeRoomId, rooms, loadRooms } = useChatStore();

    // 1. Socket.IO Connection
    useEffect(() => {
        const token = localStorage.getItem('access_token'); // Token for auth
        if (!token) return;

        // Initialize Socket
        // Derive root URL from API base URL (remove /api/v1)
        const apiBase = import.meta.env.VITE_API_BASE_URL || '/api/v1';
        const socketUrl = apiBase.replace(/\/api\/v1\/?$/, '');

        socketRef.current = io(socketUrl, {
            path: '/ws/socket.io',
            auth: { token },
            transports: ['websocket', 'polling'], // Try websocket first
            reconnectionAttempts: 5
        });

        const socket = socketRef.current;

        socket.on('connect', () => {
            console.log('✅ Socket Connected:', socket.id);
        });

        socket.on('disconnect', () => {
            console.log('❌ Socket Disconnected');
        });

        // Listen for new messages
        socket.on('message', (payload) => {
            console.log('📩 New Real-time Message:', payload);

            // Check if this message is from a room we don't have yet
            const roomExists = rooms.find(r => r.id === payload.room_id);
            if (!roomExists) {
                console.log('🔄 New room detected, refreshing room list...');
                loadRooms(); // Reload rooms to show the new conversation
            }

            // Update Store with the message
            addMessage(payload.room_id, payload);
        });

        return () => {
            if (socket) socket.disconnect();
        };
    }, [addMessage, rooms, loadRooms]);

    // 2. Auto-join rooms when activeRoomId changes
    useEffect(() => {
        if (socketRef.current && activeRoomId) {
            console.log('🔗 Joining room:', activeRoomId);
            socketRef.current.emit('join_room', { room_id: activeRoomId });
        }
    }, [activeRoomId]);

    // 2. Offline Queue Processing (Existing Logic)
    useEffect(() => {
        const processQueue = async () => {
            if (!navigator.onLine) return;

            const queue = await chatStorage.getQueue();
            if (queue.length === 0) return;

            console.log(`Syncing ${queue.length} pending actions...`);

            for (const item of queue) {
                try {
                    await chatStorage.updateQueueStatus(item.id, 'processing');

                    if (item.type === 'SEND_MESSAGE') {
                        const { roomId, message } = item.payload;

                        // Send to API
                        const { data: sentMessage } = await chatApi.sendMessage(roomId, {
                            ...message,
                            roomId
                        });

                        // Update local message (replace optimistic with real)
                        await chatStorage.saveMessage(sentMessage);
                        // Clean up temporary ID if different
                        if (message.client_side_uuid !== sentMessage.id) {
                            await chatStorage.db.messages.where('client_side_uuid').equals(message.client_side_uuid).delete();
                        }
                    }

                    // Remove from queue on success
                    await chatStorage.removeFromQueue(item.id);

                } catch (error) {
                    console.error(`Failed to sync item ${item.id}`, error);
                    await chatStorage.updateQueueStatus(item.id, 'failed', error.message);
                }
            }
        };

        const handleOnline = () => {
            processQueue();
        };

        window.addEventListener('online', handleOnline);

        // Initial check on mount
        processQueue();

        const interval = setInterval(processQueue, 30000); // Check every 30s

        return () => {
            window.removeEventListener('online', handleOnline);
            clearInterval(interval);
        };
    }, []);
};

export default useChatSync;
