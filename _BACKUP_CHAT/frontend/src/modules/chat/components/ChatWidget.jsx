import React, { useEffect, useRef, useState } from 'react';
import useChatStore from '../context/useChatStore';
import useChatSync from '../hooks/useChatSync';
import { FiMessageSquare, FiMoreVertical } from 'react-icons/fi';
import MessageBubble from './MessageBubble';
import InputArea from './InputArea';
import Avatar from './Avatar';
import RoomMenuDropdown from './RoomMenuDropdown';

const ChatWidget = ({ className = "h-[600px] w-full max-w-4xl", style = {} }) => {
    const {
        rooms,
        activeRoomId,
        messages,
        setActiveRoom,
        loadRooms,
        sendMessage,
        deleteRoom,
        isLoading
    } = useChatStore();

    // Initialize background sync
    useChatSync();

    const scrollRef = useRef(null);
    const [openMenuRoomId, setOpenMenuRoomId] = useState(null);
    const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });

    useEffect(() => {
        loadRooms();
    }, [loadRooms]);

    const activeMessages = activeRoomId ? (messages[activeRoomId] || []) : [];
    const activeRoom = rooms.find(r => r.id === activeRoomId);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [activeMessages]);

    const handleSend = async (content, type = 'text', mediaUrl = null, mediaMeta = null) => {
        if (!activeRoomId) return;
        await sendMessage(activeRoomId, content, type, mediaUrl, mediaMeta);
    };

    // Extract participant name from room metadata
    const getParticipantName = (room) => {
        return room?.meta_data?.guest_name || room?.meta_data?.name || `Consulta #${room?.id?.slice(0, 8)}`;
    };

    const handleMenuClick = (e, roomId) => {
        e.stopPropagation();
        const buttonRect = e.currentTarget.getBoundingClientRect();
        setMenuPosition({
            top: buttonRect.bottom + 5,
            right: window.innerWidth - buttonRect.right
        });
        setOpenMenuRoomId(roomId);
    };

    const handleDeleteRoom = async (roomId) => {
        try {
            console.log('🗑️ Attempting to delete room:', roomId);
            await deleteRoom(roomId);
            console.log('✅ Room deleted successfully');
            setOpenMenuRoomId(null);
        } catch (error) {
            console.error('❌ Failed to delete room:', error);
            alert(`Error al eliminar conversación: ${error.response?.data?.detail || error.message}`);
        }
    };

    return (
        <div className={`flex bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800 font-sans ${className}`} style={style}>
            {/* Sidebar - Room List */}
            <div className="w-[150px] border-r border-gray-200 dark:border-gray-800 flex flex-col bg-gray-50 dark:bg-gray-900/50 flex-shrink-0">
                <div className="p-2 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-900">
                    <h2 className="font-bold text-xs text-gray-800 dark:text-white tracking-tight">Chats</h2>
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${navigator.onLine
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>
                        {navigator.onLine ? 'ON' : 'OFF'}
                    </span>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {isLoading && <div className="p-4 text-center text-gray-500 text-sm">Cargando conversaciones...</div>}

                    {!isLoading && rooms.length === 0 && (
                        <div className="p-8 text-center text-gray-400 flex flex-col items-center">
                            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800/50 rounded-full flex items-center justify-center mb-3">
                                <FiMessageSquare className="w-8 h-8 opacity-40" />
                            </div>
                            <p className="text-sm">No tienes conversaciones activas</p>
                        </div>
                    )}

                    {rooms.map(room => (
                        <button
                            key={room.id}
                            onClick={() => setActiveRoom(room.id)}
                            className={`w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all border-b border-gray-100 dark:border-gray-800/50 group relative ${activeRoomId === room.id
                                ? 'bg-blue-50 dark:bg-blue-900/10 border-l-2 border-l-blue-600 pl-[0.5rem]'
                                : 'pl-2 border-l-2 border-l-transparent'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <Avatar name={getParticipantName(room)} size="sm" />
                                <div className="flex-1 min-w-0">
                                    <div className={`font-semibold text-lg truncate ${activeRoomId === room.id ? 'text-blue-700 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'
                                        }`}>
                                        {getParticipantName(room)}
                                    </div>
                                </div>
                                {/* Menu Button */}
                                <button
                                    onClick={(e) => handleMenuClick(e, room.id)}
                                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-all flex-shrink-0"
                                >
                                    <FiMoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                </button>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Dropdown Menu */}
                {openMenuRoomId && (
                    <RoomMenuDropdown
                        roomId={openMenuRoomId}
                        onDelete={handleDeleteRoom}
                        onClose={() => setOpenMenuRoomId(null)}
                        position={menuPosition}
                    />
                )}
            </div>

            {/* Chat Area */}
            <div className="flex-1 min-w-0 flex flex-col">
                {activeRoomId && activeRoom ? (
                    <>
                        {/* Chat Header */}
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center gap-3">
                            <Avatar name={getParticipantName(activeRoom)} size="md" />
                            <div className="flex-1">
                                <h3 className="font-bold text-base text-gray-900 dark:text-white">
                                    {getParticipantName(activeRoom)}
                                </h3>
                                <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                    Disponible
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto px-4 py-6 space-y-2 bg-[#f8fafc] dark:bg-[#0f172a] scroll-smooth"
                        >
                            {activeMessages.map(msg => (
                                <MessageBubble
                                    key={msg.id || msg.client_side_uuid}
                                    message={msg}
                                    isMe={msg.sender_id === 'me'}
                                />
                            ))}
                            {activeMessages.length === 0 && (
                                <div className="text-center text-gray-400 my-10 text-sm">
                                    <p>Esta es el inicio de tu conversación.</p>
                                    <p className="text-xs mt-1 opacity-70">Los mensajes están protegidos y seguros.</p>
                                </div>
                            )}
                        </div>

                        {/* Input - Fixed at bottom */}
                        <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex-shrink-0">
                            <InputArea
                                onSend={handleSend}
                                disabled={!navigator.onLine && false}
                            />
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 bg-gray-50/50 dark:bg-gray-900/50">
                        <div className="w-32 h-32 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center mb-6 shadow-sm border border-gray-100 dark:border-gray-700">
                            <FiMessageSquare className="w-14 h-14 text-blue-500/50" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-2">Bienvenido a tus Consultas</h3>
                        <p className="text-sm max-w-xs text-center text-gray-500">
                            Selecciona una conversación de la lista lateral para ver el historial o enviar nuevos mensajes.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatWidget;
