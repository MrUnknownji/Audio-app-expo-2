export interface ColorTokens {
    background: string;
    surface: string;
    surfaceElevated: string;
    surfaceGlass: string;

    primary: string;
    primaryMuted: string;
    secondary: string;
    accent: string;

    text: string;
    textSecondary: string;
    textMuted: string;

    border: string;
    borderActive: string;

    success: string;
    warning: string;
    error: string;

    // Neumorphic shadows
    shadowLight: string;
    shadowDark: string;
}

export const Colors: { dark: ColorTokens; light: ColorTokens } = {
    dark: {
        background: '#16161A',
        surface: '#1E1E24',
        surfaceElevated: '#26262E',
        surfaceGlass: '#2A2A32', // Solid, no transparency

        primary: '#7C5CFF',
        primaryMuted: '#2A2440', // Solid muted purple
        secondary: '#5CE1E6',
        accent: '#FF6B9D',

        text: '#F5F5F7',
        textSecondary: '#A0A0A8',
        textMuted: '#606068',

        border: '#303038',
        borderActive: '#5C4AAA',

        success: '#4ADE80',
        warning: '#FBBF24',
        error: '#F87171',

        shadowLight: '#242430',
        shadowDark: '#0A0A0E',
    },
    light: {
        background: '#E4E4EA',
        surface: '#ECECF2',
        surfaceElevated: '#F8F8FC',
        surfaceGlass: '#F0F0F6', // Solid, no transparency

        primary: '#6B4EFF',
        primaryMuted: '#E0DAFF', // Solid muted purple
        secondary: '#00B4C4',
        accent: '#FF5789',

        text: '#16161A',
        textSecondary: '#606068',
        textMuted: '#909098',

        border: '#D0D0D8',
        borderActive: '#8B7ACC',

        success: '#22C55E',
        warning: '#F59E0B',
        error: '#EF4444',

        shadowLight: '#FFFFFF',
        shadowDark: '#C0C0C8',
    },
};

export type ColorScheme = keyof typeof Colors;
