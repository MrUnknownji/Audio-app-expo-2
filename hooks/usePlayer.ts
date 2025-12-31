import { useCallback } from 'react';
import { usePlayerStore } from '@/stores/playerStore';
import { Track } from '@/services/audio/types';

export function usePlayer() {
    const store = usePlayerStore();

    const playTrack = useCallback(async (track: Track) => {
        await store.play(track);
    }, []);

    const playQueue = useCallback(async (tracks: Track[], startIndex = 0) => {
        store.setQueue(tracks, startIndex);
        await store.play(tracks[startIndex]);
    }, []);

    const formatTime = useCallback((ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }, []);

    const progress = store.duration > 0
        ? (store.position / store.duration) * 100
        : 0;

    return {
        currentTrack: store.currentTrack,
        isPlaying: store.isPlaying,
        isLoading: store.isLoading,
        position: store.position,
        duration: store.duration,
        progress,
        queue: store.queue,
        queueIndex: store.queueIndex,
        repeatMode: store.repeatMode,
        isShuffled: store.isShuffled,
        volume: store.volume,
        isMuted: store.isMuted,
        playbackRate: store.playbackRate,
        loopStart: store.loopStart,
        loopEnd: store.loopEnd,

        play: store.play,
        pause: store.pause,
        resume: store.resume,
        stop: store.stop,
        seekTo: store.seekTo,
        next: store.next,
        previous: store.previous,
        toggleShuffle: store.toggleShuffle,
        toggleRepeat: store.toggleRepeat,
        setVolume: store.setVolume,
        toggleMute: store.toggleMute,
        addToQueue: store.addToQueue,
        removeFromQueue: store.removeFromQueue,
        clearQueue: store.clearQueue,
        cyclePlaybackRate: store.cyclePlaybackRate,
        setPlaybackRate: store.setPlaybackRate,
        setLoopPoint: store.setLoopPoint,
        clearLoop: store.clearLoop,

        playTrack,
        playQueue,
        formatTime,
    };
}
