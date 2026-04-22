export function hexToRgb(hex) {
    let r = 0, g = 0, b = 0;
    // Remove # if present
    hex = hex.replace(/^#/, '');
    
    if (hex.length === 3) {
        r = parseInt(hex[0] + hex[0], 16);
        g = parseInt(hex[1] + hex[1], 16);
        b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) {
        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
    }
    return [r, g, b];
}

function mixColors(color1, color2, weight) {
    const w = weight / 100;
    const r = Math.round(color1[0] * w + color2[0] * (1 - w));
    const g = Math.round(color1[1] * w + color2[1] * (1 - w));
    const b = Math.round(color1[2] * w + color2[2] * (1 - w));
    return `rgb(${r}, ${g}, ${b})`;
}

export function generatePalette(baseHex) {
    const baseRgb = hexToRgb(baseHex);
    const white = [255, 255, 255];
    const black = [0, 0, 0];

    // Tailwind standard shade distribution approx
    return {
        50: mixColors(baseRgb, white, 10),  // 90% white
        100: mixColors(baseRgb, white, 20), // 80% white
        200: mixColors(baseRgb, white, 40), // 60% white
        300: mixColors(baseRgb, white, 60), // 40% white
        400: mixColors(baseRgb, white, 80), // 20% white
        500: baseHex,                       // Base color
        600: mixColors(baseRgb, black, 85), // 15% black
        700: mixColors(baseRgb, black, 70), // 30% black
        800: mixColors(baseRgb, black, 55), // 45% black
        900: mixColors(baseRgb, black, 40), // 60% black
        950: mixColors(baseRgb, black, 25), // 75% black
    };
}

export function applyDynamicTheme(hexColor) {
    if (!hexColor || !hexColor.startsWith('#')) return;
    
    try {
        const palette = generatePalette(hexColor);
        const root = document.documentElement;
        
        // We inject the palette as --color-indigo-* so that 
        // Tailwind's modified indigo configuration picks it up.
        Object.entries(palette).forEach(([shade, color]) => {
            root.style.setProperty(`--color-indigo-${shade}`, color);
        });
    } catch (err) {
        console.error("Error applying dynamic theme:", err);
    }
}
