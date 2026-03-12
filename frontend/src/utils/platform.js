import { Capacitor } from '@capacitor/core';

/**
 * Detects if the application is running within a Capacitor native environment (iOS or Android).
 * @returns {boolean}
 */
export const isCapacitor = () => {
    // 1. Detect bridge
    const cap = window.Capacitor || (window.parent && window.parent.Capacitor);
    
    // 2. Determine if native: Flag true OR bridge exists in a non-web environment
    // Note: In our customized APK, the existence of ANY Capacitor bridge is sufficient proof.
    const isNative = !!(cap && (cap.isNativePlatform?.() || cap.Plugins || true)) && 
                     (window.location.protocol !== 'http:' && window.location.protocol !== 'https:' || !!cap);
    
    // Even more direct: if window.Capacitor exists, we ARE in the app
    const finalIsNative = !!window.Capacitor || !!(window.parent && window.parent.Capacitor);

    console.log(`[GynSysDebug] Detection - isNative: ${finalIsNative}, BridgeFound: ${!!cap}`);
    return finalIsNative;
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
