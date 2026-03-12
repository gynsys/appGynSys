import { Capacitor } from '@capacitor/core';

/**
 * Detects if the application is running within a Capacitor native environment (iOS or Android).
 * @returns {boolean}
 */
export const isCapacitor = () => {
    // Try to detect if we have the bridge locally or in the parent (for some webview contexts)
    const cap = window.Capacitor || (window.parent && window.parent.Capacitor);
    const isNative = (cap && cap.isNativePlatform && cap.isNativePlatform()) || Capacitor.isNativePlatform();
    
    console.log(`[GynSysDebug] Detection - isNative: ${isNative}, Bridge: ${!!cap}`);
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
