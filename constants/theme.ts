import { Colors } from './colors';

export const Theme = {
    spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        xxl: 48,
    },

    borderRadius: {
        sm: 8,
        md: 12,
        lg: 16,
        xl: 24,
        full: 9999,
    },

    typography: {
        hero: {
            fontSize: 48,
            fontWeight: '800' as const,
            letterSpacing: -1.5,
            lineHeight: 56,
        },
        title: {
            fontSize: 28,
            fontWeight: '700' as const,
            letterSpacing: -0.5,
            lineHeight: 36,
        },
        heading: {
            fontSize: 20,
            fontWeight: '600' as const,
            letterSpacing: 0,
            lineHeight: 28,
        },
        body: {
            fontSize: 16,
            fontWeight: '400' as const,
            letterSpacing: 0.15,
            lineHeight: 24,
        },
        bodySmall: {
            fontSize: 14,
            fontWeight: '400' as const,
            letterSpacing: 0.25,
            lineHeight: 20,
        },
        caption: {
            fontSize: 12,
            fontWeight: '500' as const,
            letterSpacing: 0.4,
            lineHeight: 16,
        },
        micro: {
            fontSize: 10,
            fontWeight: '600' as const,
            letterSpacing: 0.5,
            lineHeight: 14,
        },
    },

    shadows: {
        sm: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
        },
        md: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 4,
        },
        lg: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.2,
            shadowRadius: 16,
            elevation: 8,
        },
        glow: (color: string) => ({
            shadowColor: color,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.4,
            shadowRadius: 20,
            elevation: 0,
        }),
    },

    animation: {
        fast: 150,
        normal: 300,
        slow: 500,
        spring: {
            damping: 15,
            stiffness: 150,
        },
    },
} as const;

export { Colors };
