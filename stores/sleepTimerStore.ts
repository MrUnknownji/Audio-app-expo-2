import { create } from 'zustand';
import { usePlayerStore } from './playerStore';
import { unifiedAudioService } from '@/services/audio/player';

interface SleepTimerStore {
    remainingMs: number | null;
    endTime: number | null;
    isActive: boolean;
    intervalId: ReturnType<typeof setInterval> | null;
    setTimer: (minutes: number) => void;
    cancelTimer: () => void;
    getRemainingFormatted: () => string;
}

export const useSleepTimerStore = create<SleepTimerStore>((set, get) => ({
    remainingMs: null,
    endTime: null,
    isActive: false,
    intervalId: null,

    setTimer: (minutes: number) => {
        const state = get();

        // Clear any existing timer
        if (state.intervalId) {
            clearInterval(state.intervalId);
        }

        const durationMs = minutes * 60 * 1000;
        const endTime = Date.now() + durationMs;

        const intervalId = setInterval(() => {
            const remaining = get().endTime! - Date.now();

            if (remaining <= 0) {
                // Timer finished - pause playback
                usePlayerStore.getState().pause();
                get().cancelTimer();
                return;
            }

            // Fade out volume in last 30 seconds
            if (remaining <= 30000 && remaining > 0) {
                const fadeProgress = remaining / 30000;
                const originalVolume = usePlayerStore.getState().volume;
                // Only fade if we haven't started fading yet
                if (fadeProgress < 1) {
                    unifiedAudioService.setVolume(originalVolume * fadeProgress);
                }
            }

            set({ remainingMs: remaining });
        }, 1000);

        set({
            remainingMs: durationMs,
            endTime,
            isActive: true,
            intervalId,
        });
    },

    cancelTimer: () => {
        const state = get();
        if (state.intervalId) {
            clearInterval(state.intervalId);
        }
        set({
            remainingMs: null,
            endTime: null,
            isActive: false,
            intervalId: null,
        });
    },

    getRemainingFormatted: () => {
        const { remainingMs } = get();
        if (!remainingMs) return '';

        const totalSeconds = Math.ceil(remainingMs / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    },
}));
