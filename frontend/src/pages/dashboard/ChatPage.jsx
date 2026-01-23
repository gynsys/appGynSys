import React from 'react';
import ChatWidget from '../../modules/chat'; // Import via index to test module export

const ChatPage = () => {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Consultas Online</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Gestiona tus conversaciones con pacientes de forma segura y privada.
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-1 min-h-[600px]">
                {/* The Chat Widget takes full height */}
                <ChatWidget />
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900 rounded-lg p-4 flex gap-3 text-sm text-blue-800 dark:text-blue-300">
                <div className="flex-shrink-0 mt-0.5">ℹ️</div>
                <div>
                    <p className="font-medium mb-1">Modo Offline Activo</p>
                    <p>
                        Tus mensajes se guardan localmente en tu dispositivo. Se sincronizarán automáticamente con el servidor cuando recuperes la conexión.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ChatPage;
