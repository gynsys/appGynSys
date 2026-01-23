import React, { useState, useEffect } from 'react';
import { FiMessageSquare, FiX, FiMinus, FiUser } from 'react-icons/fi';
import ChatWidget from './ChatWidget';
import useChatStore from '../context/useChatStore';
import axios from '@/lib/axios';

const PatientChatFloatingButton = ({ primaryColor = '#4F46E5', doctorName, doctorId }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [guestName, setGuestName] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Get loadRooms from chat store
    const { loadRooms } = useChatStore();

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (token) {
            setIsAuthenticated(true);
        }
    }, [isOpen]);

    const handleGuestLogin = async (e) => {
        e.preventDefault();
        if (!guestName.trim()) return;

        setIsLoading(true);
        try {
            const { data } = await axios.post('/auth/guest-login', {
                doctor_id: doctorId,
                name: guestName
            });

            localStorage.setItem('access_token', data.access_token);
            setIsAuthenticated(true);

            // Load rooms immediately after authentication
            // The ChatWidget will auto-select the first room via loadRooms logic
            loadRooms();
        } catch (error) {
            console.error('Guest login failed', error);
            alert('Error al iniciar el chat. Por favor intenta de nuevo.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Chat Interface Popover */}
            <div
                className={`fixed bottom-24 right-6 z-50 transition-all duration-300 transform origin-bottom-right ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-10 pointer-events-none'
                    }`}
            >
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 w-[380px] md:w-[450px] overflow-hidden flex flex-col h-[500px]">
                    {/* Header Override for Floating Mode */}
                    <div
                        className="p-3 text-white flex justify-between items-center shadow-sm cursor-pointer"
                        style={{ backgroundColor: primaryColor }}
                        onClick={() => setIsOpen(false)}
                    >
                        <div className="flex items-center gap-2">
                            <FiMessageSquare className="w-5 h-5" />
                            <span className="font-semibold text-sm">Chat con {doctorName}</span>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} className="hover:bg-white/20 p-1 rounded">
                                <FiMinus className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Content: Login Form or Chat Widget */}
                    {isAuthenticated ? (
                        <ChatWidget className="h-full w-full border-none shadow-none rounded-none" />
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-900">
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 w-full">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 text-center">
                                    Iniciar Conversación
                                </h3>
                                <p className="text-sm text-gray-500 mb-6 text-center">
                                    Ingresa tu nombre para comenzar a chatear con el especialista.
                                </p>

                                <form onSubmit={handleGuestLogin} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tu Nombre</label>
                                        <div className="relative">
                                            <FiUser className="absolute left-3 top-3 text-gray-400" />
                                            <input
                                                type="text"
                                                value={guestName}
                                                onChange={(e) => setGuestName(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                placeholder="Ej. María Pérez"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full py-2.5 rounded-lg text-white font-semibold shadow-md transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                                        style={{ backgroundColor: primaryColor }}
                                    >
                                        {isLoading ? 'Iniciando...' : 'Comenzar Chat'}
                                    </button>
                                </form>
                                <p className="text-xs text-center text-gray-400 mt-4">
                                    Tus datos son privados y seguros.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Floating Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={`fixed bottom-6 right-20 md:right-24 z-50 p-4 rounded-full shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center justify-center text-white ${isOpen ? 'rotate-90' : 'rotate-0'}`}
                style={{ backgroundColor: primaryColor }}
                aria-label="Abrir chat"
            >
                {isOpen ? <FiX className="w-6 h-6" /> : <FiMessageSquare className="w-6 h-6" />}

                {/* Tooltip/Label */}
                {(!isOpen && isHovered) && (
                    <span className="absolute right-full mr-3 bg-gray-900 text-white text-xs py-1 px-2 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 animate-fade-in">
                        Enviar mensaje
                    </span>
                )}
            </button>
        </>
    );
};

export default PatientChatFloatingButton;
