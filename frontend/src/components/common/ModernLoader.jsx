import React from 'react';

const ModernLoader = ({ isOpen, text = 'Procesando...', primaryColor = '#4F46E5' }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center transition-all duration-300">
            <div className="flex flex-col items-center">
                {/* Modern Ring Animation */}
                <div className="relative w-16 h-16 mb-4">
                    <div className="absolute inset-0 border-4 border-gray-200 dark:border-gray-700 rounded-full"></div>
                    <div 
                        className="absolute inset-0 border-4 rounded-full border-t-transparent animate-spin"
                        style={{ borderColor: `${primaryColor} transparent ${primaryColor} ${primaryColor}` }}
                    ></div>
                </div>

                {/* Pulsing Text */}
                <p 
                    className="text-lg font-medium animate-pulse"
                    style={{ color: primaryColor }}
                >
                    {text}
                </p>
            </div>
        </div>
    );
};

export default ModernLoader;
