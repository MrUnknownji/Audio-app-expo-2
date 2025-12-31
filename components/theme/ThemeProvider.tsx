import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { useThemeStore } from '@/stores/themeStore';
import { useTheme } from '@/hooks/useTheme';
import { usePlayer } from '@/hooks/usePlayer';
import { extractColors } from '@/services/theme/colorExtraction';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const systemColorScheme = useColorScheme();
    const { mode, followSystem, setSystemMode, dynamicColors, setExtractedColors, clearExtractedColors } = useThemeStore();
    const { colors } = useTheme();
    const { currentTrack } = usePlayer();

    // Listen for system theme changes if followSystem is enabled
    useEffect(() => {
        if (followSystem && systemColorScheme) {
            setSystemMode(systemColorScheme);
        }
    }, [followSystem, systemColorScheme, setSystemMode]);

    // Handle Dynamic Color Extraction
    useEffect(() => {
        let isMounted = true;

        const updateThemeColors = async () => {
            if (dynamicColors && currentTrack?.artwork) {
                const extracted = await extractColors(currentTrack.artwork);
                if (extracted && isMounted) {
                    setExtractedColors({
                        primary: extracted.primary,
                        secondary: extracted.secondary,
                        accent: extracted.detail,
                        background: extracted.background,
                        surface: `${extracted.secondary}1A`, // 10% opacity of secondary for surface
                    });
                }
            } else if (dynamicColors && !currentTrack) {
                if (isMounted) clearExtractedColors();
            }
        };

        updateThemeColors();

        return () => {
            isMounted = false;
        };
    }, [dynamicColors, currentTrack?.artwork, setExtractedColors, clearExtractedColors]);

    // Determine status bar style
    const statusBarStyle = mode === 'dark' ? 'light' : 'dark';

    return (
        <>
            <StatusBar style={statusBarStyle} backgroundColor={colors.background} />
            {children}
        </>
    );
}
