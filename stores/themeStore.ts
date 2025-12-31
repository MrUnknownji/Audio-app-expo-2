import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';

export type ThemeMode = 'dark' | 'light';

export interface ExtractedColors {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
}

export interface ThemeState {
    mode: ThemeMode;
    dynamicColors: boolean;
    extractedColors: ExtractedColors | null;
    followSystem: boolean;
}

interface ThemeActions {
    setMode: (mode: ThemeMode) => void;
    setSystemMode: (mode: ThemeMode) => void;
    toggleMode: () => void;
    setDynamicColors: (enabled: boolean) => void;
    setExtractedColors: (colors: ExtractedColors) => void;
    clearExtractedColors: () => void;
    setFollowSystem: (enabled: boolean) => void;
}

interface ThemeStore extends ThemeState, ThemeActions { }

const getSystemTheme = (): ThemeMode => {
    const colorScheme = Appearance.getColorScheme();
    return colorScheme === 'light' ? 'light' : 'dark';
};

export const useThemeStore = create<ThemeStore>()(
    persist(
        (set, get) => ({
            mode: 'dark',
            dynamicColors: false,
            extractedColors: null,
            followSystem: false,

            setMode: (mode: ThemeMode) => {
                set({ mode, followSystem: false });
            },

            setSystemMode: (mode: ThemeMode) => {
                // Only update if actually following system
                if (get().followSystem) {
                    set({ mode });
                }
            },

            toggleMode: () => {
                const currentMode = get().mode;
                set({
                    mode: currentMode === 'dark' ? 'light' : 'dark',
                    followSystem: false
                });
            },

            setDynamicColors: (enabled: boolean) => {
                set({ dynamicColors: enabled });
                if (!enabled) {
                    set({ extractedColors: null });
                }
            },

            setExtractedColors: (colors: ExtractedColors) => {
                if (get().dynamicColors) {
                    set({ extractedColors: colors });
                }
            },

            clearExtractedColors: () => {
                set({ extractedColors: null });
            },

            setFollowSystem: (enabled: boolean) => {
                set({ followSystem: enabled });
                if (enabled) {
                    set({ mode: getSystemTheme() });
                }
            },
        }),
        {
            name: 'audio-vibes-theme',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                mode: state.mode,
                dynamicColors: state.dynamicColors,
                followSystem: state.followSystem,
            }),
            onRehydrateStorage: () => (state) => {
                if (state?.followSystem) {
                    state.mode = getSystemTheme();
                }
            },
        }
    )
);
