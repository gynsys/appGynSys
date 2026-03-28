import React from 'react';

const GynSysLoader = ({ className = "" }) => {
    return (
        <div className={`min-h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-900 gap-4 ${className}`}>
            <div className="w-8 h-8 rounded-full border-4 border-gray-200 dark:border-gray-800 border-t-indigo-600 dark:border-t-indigo-500 animate-spin"></div>
            <p className="text-sm font-medium text-gray-400 dark:text-gray-500 tracking-widest uppercase">Cargando...</p>
        </div>
    );
};

export default GynSysLoader;
