import { create } from 'zustand';
import { Track, RepeatMode, PlayerState } from '@/services/audio/types';
import { unifiedAudioService } from '@/services/audio/player';
import { useStatsStore } from './statsStore';

let trackStartPosition = 0;

interface PlayerStore extends PlayerState {
    play: (track?: Track) => Promise<void>;
    pause: () => Promise<void>;
    resume: () => Promise<void>;
    stop: () => Promise<void>;
    seekTo: (position: number) => Promise<void>;
    next: () => Promise<void>;
    previous: () => Promise<void>;
    setQueue: (tracks: Track[], startIndex?: number) => void;
    addToQueue: (track: Track) => void;
    removeFromQueue: (index: number) => void;
    clearQueue: () => void;
    toggleShuffle: () => void;
    toggleRepeat: () => void;
    setVolume: (volume: number) => Promise<void>;
    toggleMute: () => void;
    updatePosition: (position: number) => void;
    handlePlaybackStatusUpdate: (status: any) => void;
    playbackRate: number;
    setPlaybackRate: (rate: number) => void;
    cyclePlaybackRate: () => void;
    // AB Loop
    loopStart: number | null;
    loopEnd: number | null;
    setLoopPoint: (type: 'A' | 'B') => void;
    clearLoop: () => void;
}

function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

export const usePlayerStore = create<PlayerStore>((set, get) => {
    unifiedAudioService.setStatusUpdateCallback((status) => {
        get().handlePlaybackStatusUpdate(status);
    });

    // Setup remote control callbacks for notification controls
    unifiedAudioService.setRemoteControlCallbacks({
        onPlay: () => get().resume(),
        onPause: () => get().pause(),
        onNext: () => get().next(),
        onPrevious: () => get().previous(),
        onSeek: (positionMs) => get().seekTo(positionMs),
    });

    return {
        currentTrack: null,
        queue: [],
        queueIndex: -1,
        isPlaying: false,
        isLoading: false,
        position: 0,
        duration: 0,
        volume: 1,
        isMuted: false,
        repeatMode: 'off',
        isShuffled: false,
        playbackRate: 1.0,
        loopStart: null,
        loopEnd: null,

        play: async (track?: Track) => {
            const state = get();

            // Prevent rapid repeated calls with the same track
            if (track && state.isLoading && state.currentTrack?.id === track.id) {
                return;
            }

            if (track) {
                // Record stats for the track we're leaving
                if (state.currentTrack && state.position > trackStartPosition) {
                    const listenedDuration = state.position - trackStartPosition;
                    useStatsStore.getState().recordPlay(state.currentTrack, listenedDuration);
                }

                // Stop current playback first
                if (state.isPlaying) {
                    await unifiedAudioService.stop();
                }

                set({ isLoading: true, currentTrack: track, duration: track.duration, isPlaying: false });

                try {
                    await unifiedAudioService.loadTrack(track);
                    await unifiedAudioService.play();
                    trackStartPosition = 0;
                    set({ isPlaying: true, isLoading: false });
                } catch (error) {
                    console.error('Failed to play track:', error);
                    set({ isLoading: false });
                }
            } else if (state.currentTrack && !state.isLoading) {
                await unifiedAudioService.play();
                set({ isPlaying: true });
            }
        },

        pause: async () => {
            await unifiedAudioService.pause();
            set({ isPlaying: false });
        },

        resume: async () => {
            await unifiedAudioService.play();
            set({ isPlaying: true });
        },

        stop: async () => {
            await unifiedAudioService.stop();
            set({ isPlaying: false, position: 0 });
        },

        seekTo: async (position: number) => {
            await unifiedAudioService.seekTo(position);
            set({ position });
        },

        next: async () => {
            const { queue, queueIndex, repeatMode } = get();

            if (queue.length === 0) return;

            let nextIndex = queueIndex + 1;

            if (nextIndex >= queue.length) {
                if (repeatMode === 'all') {
                    nextIndex = 0;
                } else {
                    return;
                }
            }

            const nextTrack = queue[nextIndex];
            set({ queueIndex: nextIndex });
            await get().play(nextTrack);
        },

        previous: async () => {
            const { queue, queueIndex, position } = get();

            if (queue.length === 0) return;

            if (position > 3000) {
                await get().seekTo(0);
                return;
            }

            let prevIndex = queueIndex - 1;
            if (prevIndex < 0) {
                prevIndex = queue.length - 1;
            }

            const prevTrack = queue[prevIndex];
            set({ queueIndex: prevIndex });
            await get().play(prevTrack);
        },

        setQueue: (tracks: Track[], startIndex = 0) => {
            const queue = get().isShuffled ? shuffleArray(tracks) : tracks;
            set({
                queue,
                queueIndex: startIndex,
                currentTrack: queue[startIndex]
            });
        },

        addToQueue: (track: Track) => {
            set(state => ({ queue: [...state.queue, track] }));
        },

        removeFromQueue: (index: number) => {
            set(state => ({
                queue: state.queue.filter((_, i) => i !== index),
                queueIndex: index < state.queueIndex
                    ? state.queueIndex - 1
                    : state.queueIndex
            }));
        },

        clearQueue: () => {
            set({ queue: [], queueIndex: -1 });
        },

        toggleShuffle: () => {
            set(state => {
                const newShuffled = !state.isShuffled;
                const currentTrack = state.currentTrack;

                if (newShuffled && state.queue.length > 0) {
                    const shuffled = shuffleArray(state.queue);
                    const newIndex = currentTrack
                        ? shuffled.findIndex(t => t.id === currentTrack.id)
                        : 0;
                    return { isShuffled: true, queue: shuffled, queueIndex: newIndex };
                }

                return { isShuffled: false };
            });
        },

        toggleRepeat: () => {
            set(state => {
                const modes: RepeatMode[] = ['off', 'all', 'one'];
                const currentIndex = modes.indexOf(state.repeatMode);
                const nextMode = modes[(currentIndex + 1) % modes.length];
                return { repeatMode: nextMode };
            });
        },

        setVolume: async (volume: number) => {
            await unifiedAudioService.setVolume(volume);
            set({ volume, isMuted: false });
        },

        toggleMute: () => {
            set(state => {
                const newMuted = !state.isMuted;
                unifiedAudioService.setMuted(newMuted);
                return { isMuted: newMuted };
            });
        },

        updatePosition: (position: number) => {
            set({ position });
        },

        handlePlaybackStatusUpdate: (status: any) => {
            if (!status.isLoaded) return;

            const state = get();
            const currentPosition = status.positionMillis || 0;

            // AB Loop check - seek back to A if we've reached B
            if (state.loopStart !== null && state.loopEnd !== null) {
                if (currentPosition >= state.loopEnd) {
                    get().seekTo(state.loopStart);
                    return;
                }
            }

            set({
                position: currentPosition,
                duration: status.durationMillis || state.duration,
                isPlaying: status.isPlaying || false,
            });

            if (status.didJustFinish) {
                const { repeatMode, currentTrack } = state;

                // Record stats for completed track
                if (currentTrack && currentPosition > trackStartPosition) {
                    const listenedDuration = currentPosition - trackStartPosition;
                    useStatsStore.getState().recordPlay(currentTrack, listenedDuration);
                }

                if (repeatMode === 'one') {
                    trackStartPosition = 0;
                    get().seekTo(0);
                    get().resume();
                } else {
                    get().next();
                }
            }
        },

        setPlaybackRate: (rate: number) => {
            const clampedRate = Math.max(0.5, Math.min(2.0, rate));
            unifiedAudioService.setPlaybackRate(clampedRate);
            set({ playbackRate: clampedRate });
        },

        cyclePlaybackRate: () => {
            const rates = [0.75, 1.0, 1.25, 1.5, 2.0];
            const currentRate = get().playbackRate;
            const currentIndex = rates.findIndex(r => Math.abs(r - currentRate) < 0.01);
            const nextIndex = (currentIndex + 1) % rates.length;
            get().setPlaybackRate(rates[nextIndex]);
        },

        setLoopPoint: (type: 'A' | 'B') => {
            const { position, loopStart } = get();
            if (type === 'A') {
                set({ loopStart: position, loopEnd: null });
            } else {
                // Only set B if A is set and B > A
                if (loopStart !== null && position > loopStart) {
                    set({ loopEnd: position });
                }
            }
        },

        clearLoop: () => {
            set({ loopStart: null, loopEnd: null });
        },
    };
});
