/**
 * Platform utilities for GynSys.
 * Updated: 2026-03-15 12:05
 */
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

/**
 * Specifically triggers a file download.
 * On web, it uses a hidden anchor tag to avoid tab flickering.
 * On Capacitor, it uses openExternalFile.
 * @param {string|Blob} data - URL or Blob to download
 * @param {string} filename 
 */
export const downloadFile = async (data, filename = 'documento.mp4') => {
    const isNative = isCapacitor();
    console.log(`[GynSys] Starting download for ${filename} (isNative: ${isNative})`);

    let url = data;
    let blob = null;

    if (data instanceof Blob) {
        blob = data;
        url = URL.createObjectURL(blob);
    }

    if (isNative) {
        // En Capacitor, abrir el blob directamente suele fallar.
        // Si tenemos un bridge, intentamos abrirlo en el navegador del sistema.
        return openExternalFile(url);
    }
    
    const isMobileBrowser = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    // Fallback para iOS/Android Chrome donde Blobs directos fallan
    if (isMobileBrowser && blob) {
        try {
            const reader = new FileReader();
            reader.onloadend = () => {
                const a = document.createElement('a');
                a.href = reader.result;
                a.download = filename;
                a.style.display = 'none';
                document.body.appendChild(a);
                a.click();
                setTimeout(() => document.body.removeChild(a), 100);
            };
            reader.readAsDataURL(blob);
            return;
        } catch (e) {
            console.error('[GynSys] Base64 download failed', e);
        }
    }

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
        document.body.removeChild(link);
        if (data instanceof Blob) URL.revokeObjectURL(url);
    }, 100);
};

/**
 * Copies text to the clipboard with a robust fallback for non-secure contexts.
 * Also triggers a native alert in Capacitor for better UX feedback.
 * @param {string} text 
 * @param {string} successMsg 
 */
export const copyToClipboard = async (text, successMsg = '¡Link de Onboarding copiado!') => {
    let success = false;
    
    // 1. Try modern API
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
            success = true;
        }
    } catch (err) {
        console.error('[GynSys] Clipboard API failed:', err);
    }
    
    // 2. Fallback for non-secure contexts (http://localhost in Capacitor)
    if (!success) {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            success = true;
        } catch (err) {
            console.error('[GynSys] Fallback copy failed:', err);
        }
        document.body.removeChild(textArea);
    }

    if (success) {
        // Feedback
        if (isCapacitor()) {
            // For native app, use a standard alert so user receives feedback immediately
            window.alert(successMsg);
        }
        return true;
    }
    return false;
};
