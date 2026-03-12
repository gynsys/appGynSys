import { Capacitor } from '@capacitor/core';

/**
 * Detects if the application is running within a Capacitor native environment (iOS or Android).
 * @returns {boolean}
 */
export const isCapacitor = () => {
    // 1. Detect bridge object
    const cap = window.Capacitor || (window.parent && window.parent.Capacitor);
    
    // 2. Safe check for native platform
    // It's native if the bridge object exists AND it's not explicitly the web platform
    let isNative = !!(cap && cap.isNativePlatform && cap.isNativePlatform());
    
    // Fallback: If bridge exists but isNativePlatform fails/missing (older versions or custom bridge)
    if (!isNative && cap && cap.getPlatform) {
        isNative = cap.getPlatform() !== 'web';
    }

    console.log(`[GynSysDebug] Platform detection - isNative: ${isNative}, BridgeFound: ${!!cap}`);
    return isNative;
};

/**
 * Gets the current platform name (ios, android, or web).
 * @returns {string}
 */
export const getPlatform = () => {
    const platform = Capacitor.getPlatform();
    console.log(`[GynSysDebug] Current Platform: ${platform}`);
    return platform;
};
