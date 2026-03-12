import { Capacitor } from '@capacitor/core';

/**
 * Detects if the application is running within a Capacitor native environment (iOS or Android).
 * @returns {boolean}
 */
export const isCapacitor = () => {
    // 1. Detect bridge
    const cap = window.Capacitor || (window.parent && window.parent.Capacitor);
    
    // 2. Determine if native: Flag true OR bridge exists in a non-web environment
    // Note: If we are in the APK, even if the flag fails, existence of Capacitor bridge is proof
    const isNative = (cap && cap.isNativePlatform && cap.isNativePlatform()) || 
                     (cap && !!cap.Plugins) || 
                     Capacitor.isNativePlatform();
    
    console.log(`[GynSysDebug] Detection - isNative: ${isNative}, BridgeFound: ${!!cap}`);
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
