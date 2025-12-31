import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { audioEQ } from '@/services/audio/eq';
import { Ionicons } from '@expo/vector-icons';

export interface EqualizerBand {
    frequency: number;
    label: string;
    gain: number;
}

export interface EqualizerPreset {
    id: string;
    name: string;
    icon: keyof typeof Ionicons.glyphMap;
    gains: number[];
}

export interface EqualizerState {
    isEnabled: boolean;
    bands: EqualizerBand[];
    currentPresetId: string;
    customGains: number[];
}

export const FREQUENCIES = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

export const FREQUENCY_LABELS = ['32', '64', '125', '250', '500', '1K', '2K', '4K', '8K', '16K'];

export const EQ_PRESETS: EqualizerPreset[] = [
    {
        id: 'flat',
        name: 'Flat',
        icon: 'remove-outline',
        gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
    {
        id: 'bass-boost',
        name: 'Bass Boost',
        icon: 'volume-high',
        gains: [8, 6, 4, 2, 0, 0, 0, 0, 0, 0],
    },
    {
        id: 'treble-boost',
        name: 'Treble',
        icon: 'sparkles',
        gains: [0, 0, 0, 0, 0, 2, 4, 6, 8, 8],
    },
    {
        id: 'vocal',
        name: 'Vocal',
        icon: 'mic',
        gains: [-2, -2, 0, 4, 6, 6, 4, 2, 0, -2],
    },
    {
        id: 'rock',
        name: 'Rock',
        icon: 'flash',
        gains: [6, 4, 2, 0, -2, -2, 0, 4, 6, 6],
    },
    {
        id: 'pop',
        name: 'Pop',
        icon: 'musical-notes',
        gains: [-2, 0, 4, 6, 6, 4, 2, 0, -2, -2],
    },
    {
        id: 'jazz',
        name: 'Jazz',
        icon: 'wine',
        gains: [4, 2, 0, 2, -2, -2, 0, 2, 4, 4],
    },
    {
        id: 'classical',
        name: 'Classical',
        icon: 'rose',
        gains: [0, 0, 0, 0, 0, -2, -4, -4, -2, 0],
    },
    {
        id: 'electronic',
        name: 'Electronic',
        icon: 'pulse',
        gains: [6, 4, 0, -2, -2, 0, 4, 6, 6, 4],
    },
    {
        id: 'custom',
        name: 'Custom',
        icon: 'options',
        gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
];

const createInitialBands = (): EqualizerBand[] =>
    FREQUENCIES.map((freq, index) => ({
        frequency: freq,
        label: FREQUENCY_LABELS[index],
        gain: 0,
    }));

interface EqualizerStore extends EqualizerState {
    setEnabled: (enabled: boolean) => void;
    setBandGain: (index: number, gain: number) => void;
    selectPreset: (presetId: string) => void;
    resetToFlat: () => void;
    saveAsCustom: () => void;
    syncEQToAudio: () => void;
}

export const useEqualizerStore = create<EqualizerStore>()(
    persist(
        (set, get) => ({
            isEnabled: true,
            bands: createInitialBands(),
            currentPresetId: 'flat',
            customGains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],

            setEnabled: (enabled: boolean) => {
                audioEQ.setEnabled(enabled);
                set({ isEnabled: enabled });
            },

            setBandGain: (index: number, gain: number) => {
                const clampedGain = Math.max(-12, Math.min(12, gain));

                audioEQ.setBandGain(index, clampedGain);

                set((state) => {
                    const newBands = [...state.bands];
                    newBands[index] = { ...newBands[index], gain: clampedGain };

                    return {
                        bands: newBands,
                        currentPresetId: 'custom',
                    };
                });
            },

            selectPreset: (presetId: string) => {
                const preset = EQ_PRESETS.find((p) => p.id === presetId);
                if (!preset) return;

                const gains = presetId === 'custom' ? get().customGains : preset.gains;

                audioEQ.setAllBands(gains);

                set((state) => ({
                    currentPresetId: presetId,
                    bands: state.bands.map((band, index) => ({
                        ...band,
                        gain: gains[index],
                    })),
                }));

                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            },

            resetToFlat: () => {
                audioEQ.reset();

                set({
                    currentPresetId: 'flat',
                    bands: createInitialBands(),
                });

                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            },

            saveAsCustom: () => {
                const bands = get().bands;
                const customGains = bands.map((b) => b.gain);

                set({ customGains });

                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            },

            syncEQToAudio: () => {
                const { bands, isEnabled } = get();
                const gains = bands.map(b => b.gain);

                if (isEnabled) {
                    audioEQ.setAllBands(gains);
                } else {
                    audioEQ.setEnabled(false);
                }
            },
        }),
        {
            name: 'audio-vibes-equalizer',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                isEnabled: state.isEnabled,
                bands: state.bands,
                currentPresetId: state.currentPresetId,
                customGains: state.customGains,
            }),
            onRehydrateStorage: () => (state) => {
                if (state) {
                    state.syncEQToAudio();
                }
            },
        }
    )
);
