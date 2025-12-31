export interface ImageColors {
    primary: string;
    secondary: string;
    background: string;
    detail: string;
}

// Helper to convert HSL to Hex
function hslToHex(h: number, s: number, l: number): string {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = (n: number) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

export const extractColors = async (imageUri: string): Promise<ImageColors | null> => {
    if (!imageUri) return null;

    // Deterministic hash from URI
    const hash = imageUri.split('').reduce((acc, char) => {
        return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);

    const hue = Math.abs(hash % 360);

    // Generate a MUTED palette based on the hash
    // Primary: Muted, less saturated for readability
    const primary = hslToHex(hue, 50, 55); // Reduced saturation from 80 to 50

    // Secondary: Analogous, softer
    const secondary = hslToHex((hue + 35) % 360, 40, 50); // Reduced saturation

    // Background: Very dark version of primary (for dark mode)
    const background = hslToHex(hue, 20, 10);

    // Detail: Complementary but muted
    const detail = hslToHex((hue + 180) % 360, 45, 55); // Reduced saturation

    return {
        primary,
        secondary,
        background,
        detail,
    };
};
