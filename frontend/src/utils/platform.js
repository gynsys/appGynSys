import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

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

/**
 * Opens a file or URL in the system's external browser.
 * Mandatory for PDFs in Capacitor as internal WebViews don't handle them well.
 * @param {string} url 
 */
export const openExternalFile = async (url) => {
    if (isCapacitor()) {
        console.log(`[GynSys] Opening external URL via Capacitor Browser: ${url}`);
        await Browser.open({ url, windowName: '_system' });
    } else {
        console.log(`[GynSys] Opening external URL via window.open: ${url}`);
        window.open(url, '_blank', 'noopener,noreferrer');
    }
};
