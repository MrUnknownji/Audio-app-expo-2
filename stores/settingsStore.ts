import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsStore {
    crossfadeDuration: number; // 0-12 seconds (0 = off)
    gaplessPlayback: boolean;
    shakeToShuffle: boolean;
    focusMode: boolean;
    setCrossfadeDuration: (seconds: number) => void;
    setGaplessPlayback: (enabled: boolean) => void;
    setShakeToShuffle: (enabled: boolean) => void;
    setFocusMode: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsStore>()(
    persist(
        (set) => ({
            crossfadeDuration: 0,
            gaplessPlayback: false,
            shakeToShuffle: false,
            focusMode: false,

            setCrossfadeDuration: (seconds: number) => {
                set({ crossfadeDuration: Math.max(0, Math.min(12, seconds)) });
            },

            setGaplessPlayback: (enabled: boolean) => {
                set({ gaplessPlayback: enabled });
            },

            setShakeToShuffle: (enabled: boolean) => {
                set({ shakeToShuffle: enabled });
            },

            setFocusMode: (enabled: boolean) => {
                set({ focusMode: enabled });
            },
        }),
        {
            name: 'audio-vibes-settings',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
