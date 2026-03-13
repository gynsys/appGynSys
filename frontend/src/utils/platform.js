import { Capacitor } from '@capacitor/core';

/**
 * Detects if the application is running within a Capacitor native environment (iOS or Android).
 * @returns {boolean}
 */
export const isCapacitor = () => {
    // 1. Synchronous detection by User Agent (Strictly for our App)
    const ua = window.navigator.userAgent;
    const isUAApp = ua.includes('GynSysApp') || ua.includes('Capacitor');
    
    // 2. Detect bridge object
    const cap = window.Capacitor || (window.parent && window.parent.Capacitor) || (window.top && window.top.Capacitor);
    
    // 3. Native check
    const isNative = isUAApp || !!(cap && cap.isNativePlatform && cap.isNativePlatform());

    console.log(`[GynSysDebug] Platform detection - isNative: ${isNative}, UA: ${isUAApp}, BridgeFound: ${!!cap}`);
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
