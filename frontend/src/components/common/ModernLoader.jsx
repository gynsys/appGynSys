import React from 'react';

const ModernLoader = ({ isOpen, text = 'Procesando...' }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 backdrop-blur-sm transition-all duration-300">
            <div className="flex flex-col items-center">
                {/* Modern Ring Animation */}
                <div className="relative w-16 h-16 mb-4">
                    <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                </div>

                {/* Pulsing Text */}
                <p className="text-lg font-medium text-gray-700 animate-pulse">
                    {text}
                </p>
            </div>
        </div>
    );
};

export default ModernLoader;
