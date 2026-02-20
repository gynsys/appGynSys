import React from 'react';

const GynSysLoader = ({ className = "" }) => {
    return (
        <div className={`min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 ${className}`}>
            <div className="flex flex-col items-center">
                <img
                    src="/GynSys.png"
                    alt="GynSys Logo"
                    className="w-32 h-auto animate-pulse"
                />
            </div>
        </div>
    );
};

export default GynSysLoader;
