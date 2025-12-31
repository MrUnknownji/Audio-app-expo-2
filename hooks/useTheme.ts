import { useMemo } from 'react';
import { useThemeStore, ThemeMode, ExtractedColors } from '@/stores/themeStore';
import { Colors, ColorTokens } from '@/constants/colors';

function adjustColorBrightness(hex: string, percent: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, Math.max(0, (num >> 16) + amt));
    const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amt));
    const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

// Create a solid muted version of a color (no transparency)
function createMutedColor(hex: string, darkenPercent: number): string {
    return adjustColorBrightness(hex, -darkenPercent);
}

function generateDynamicColors(
    extractedColors: ExtractedColors,
    mode: ThemeMode
): ColorTokens {
    const isDark = mode === 'dark';
    const primary = extractedColors.primary;
    const secondary = extractedColors.secondary || adjustColorBrightness(primary, isDark ? 30 : -30);
    const accent = extractedColors.accent || adjustColorBrightness(primary, isDark ? 60 : -60);

    if (isDark) {
        // All solid colors - no transparency
        return {
            background: extractedColors.background || '#16161A',
            surface: extractedColors.surface || '#1E1E24',
            surfaceElevated: adjustColorBrightness(extractedColors.surface || '#1E1E24', 10),
            surfaceGlass: adjustColorBrightness(extractedColors.surface || '#1E1E24', 15), // Solid

            primary,
            primaryMuted: createMutedColor(primary, 50), // Solid dark version
            secondary,
            accent,

            text: '#F5F5F7',
            textSecondary: '#A0A0A8', // Solid
            textMuted: '#606068', // Solid

            border: '#303038', // Solid
            borderActive: createMutedColor(primary, 20),

            success: '#4ADE80',
            warning: '#FBBF24',
            error: '#F87171',

            shadowLight: '#242430',
            shadowDark: '#0A0A0E',
        };
    }

    return {
        background: '#E4E4EA',
        surface: '#ECECF2',
        surfaceElevated: '#F8F8FC',
        surfaceGlass: '#F0F0F6', // Solid

        primary: adjustColorBrightness(primary, -20),
        primaryMuted: adjustColorBrightness(primary, 30), // Solid light version
        secondary: adjustColorBrightness(secondary, -20),
        accent: adjustColorBrightness(accent, -20),

        text: '#16161A',
        textSecondary: '#606068', // Solid
        textMuted: '#909098', // Solid

        border: '#D0D0D8', // Solid
        borderActive: adjustColorBrightness(primary, 20),

        success: '#22C55E',
        warning: '#F59E0B',
        error: '#EF4444',

        shadowLight: '#FFFFFF',
        shadowDark: '#C0C0C8',
    };
}

export interface UseThemeReturn {
    mode: ThemeMode;
    colors: ColorTokens;
    isDark: boolean;
    isLight: boolean;
    dynamicColors: boolean;
    toggleMode: () => void;
    setMode: (mode: ThemeMode) => void;
    setDynamicColors: (enabled: boolean) => void;
}

export function useTheme(): UseThemeReturn {
    const {
        mode,
        dynamicColors,
        extractedColors,
        toggleMode,
        setMode,
        setDynamicColors,
    } = useThemeStore();

    const colors = useMemo(() => {
        if (dynamicColors && extractedColors) {
            return generateDynamicColors(extractedColors, mode);
        }
        return Colors[mode];
    }, [mode, dynamicColors, extractedColors]);

    return {
        mode,
        colors,
        isDark: mode === 'dark',
        isLight: mode === 'light',
        dynamicColors,
        toggleMode,
        setMode,
        setDynamicColors,
    };
}
