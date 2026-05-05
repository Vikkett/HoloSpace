
// Dictionary that maps color names (FR + EN) to hexadecimal color values
export const COLOR_MAP = {

    // Red variations
    rouge: 0xFF0000, red: 0xFF0000,

    // Blue variations
    bleu: 0x0000FF, blue: 0x0000FF,

    // Green variations
    vert: 0x00FF00, green: 0x00FF00,

    // Yellow variations
    jaune: 0xFFFF00, yellow: 0xFFFF00,

    // Purple / violet variations
    violet: 0x800080, purple: 0x800080,

    // Orange
    orange: 0xFFA500,

    // Black
    noir: 0x111111,

    // White
    blanc: 0xFFFFFF
};


// Function that converts a color string into a numeric hex color
export function parseColor(colorStr) {

    // If no color is provided, return default blue color
    if (!colorStr) return 0x4F86F7;

    // Normalize input (lowercase + remove spaces)
    const normalized = colorStr.toLowerCase().trim();

    // Direct match (exact key in COLOR_MAP)
    if (COLOR_MAP[normalized]) return COLOR_MAP[normalized];

    // Partial match (if input contains a known color keyword)
    for (const [key, value] of Object.entries(COLOR_MAP)) {
        if (normalized.includes(key)) return value;
    }

    // HEX format support (e.g. "#ff0000")
    if (normalized.startsWith('#')) {
        return parseInt(normalized.slice(1), 16);
    }

    // Fallback: random color if nothing matches
    return Math.random() * 0xFFFFFF;
}