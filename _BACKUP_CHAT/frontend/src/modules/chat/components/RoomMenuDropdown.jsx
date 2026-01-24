import React, { useState, useRef, useEffect } from 'react';
import { FiTrash2 } from 'react-icons/fi';

/**
 * Dropdown menu for room management actions
 * @param {string} roomId - Room ID
 * @param {function} onDelete - Callback when delete is confirmed
 * @param {function} onClose - Callback to close dropdown
 */
const RoomMenuDropdown = ({ roomId, onDelete, onClose, position = { top: 0, right: 0 } }) => {
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const handleDeleteClick = () => {
        setShowConfirmModal(true);
    };

    const handleConfirmDelete = () => {
        onDelete(roomId);
        setShowConfirmModal(false);
        onClose();
    };

    return (
        <>
            {/* Dropdown Menu */}
            <div
                ref={dropdownRef}
                className="absolute z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 min-w-[200px]"
                style={{ top: position.top, right: position.right }}
            >
                <button
                    onClick={handleDeleteClick}
                    className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                >
                    <FiTrash2 className="w-4 h-4" />
                    Eliminar chat
                </button>
            </div>

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                            ¿Eliminar conversación?
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                            Esta acción no se puede deshacer. Los mensajes se eliminarán permanentemente.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default RoomMenuDropdown;
