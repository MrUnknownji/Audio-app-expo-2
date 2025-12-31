import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Track, LibraryState } from '@/services/audio/types';
import { scanLibrary } from '@/services/library/scanner';

interface LibraryStore extends LibraryState {
    scanPhase: 'idle' | 'scanning' | 'metadata';
    scan: (extractMetadata?: boolean) => Promise<void>;
    getTracks: () => Track[];
    getTrackById: (id: string) => Track | undefined;
    searchTracks: (query: string) => Track[];
    clearLibrary: () => void;
    updateTrack: (trackId: string, updates: Partial<Track>) => void;
    selectedTracks: string[];
    isSelectionMode: boolean;
    toggleSelectionMode: () => void;
    toggleTrackSelection: (id: string) => void;
    selectAll: () => void;
    clearSelection: () => void;
}

export const useLibraryStore = create<LibraryStore>()(
    persist(
        (set, get) => ({
            tracks: [],
            isScanning: false,
            scanProgress: 0,
            scanPhase: 'idle',
            lastScanned: null,
            error: null,
            selectedTracks: [],
            isSelectionMode: false,

            toggleSelectionMode: () => {
                const isSelectionMode = !get().isSelectionMode;
                set({
                    isSelectionMode,
                    selectedTracks: [] // Always clear when toggling
                });
            },

            toggleTrackSelection: (id: string) => {
                const { selectedTracks } = get();
                if (selectedTracks.includes(id)) {
                    set({ selectedTracks: selectedTracks.filter(t => t !== id) });
                } else {
                    set({ selectedTracks: [...selectedTracks, id] });
                }
            },

            selectAll: () => {
                set({ selectedTracks: get().tracks.map(t => t.id) });
            },

            clearSelection: () => {
                set({ selectedTracks: [] });
            },


            scan: async (extractMetadata = true) => {
                set({ isScanning: true, scanProgress: 0, scanPhase: 'scanning', error: null });

                try {
                    const tracks = await scanLibrary({
                        extractMetadata,
                        onProgress: (current, total, phase) => {
                            const progress = phase === 'scanning'
                                ? Math.round((current / total) * 30)
                                : 30 + Math.round((current / total) * 70);
                            set({ scanProgress: progress, scanPhase: phase });
                        },
                    });

                    set({
                        tracks,
                        isScanning: false,
                        scanProgress: 100,
                        scanPhase: 'idle',
                        lastScanned: Date.now(),
                    });
                } catch (error) {
                    set({
                        isScanning: false,
                        scanPhase: 'idle',
                        error: error instanceof Error ? error.message : 'Failed to scan library',
                    });
                }
            },

            updateTrack: (trackId: string, updates: Partial<Track>) => {
                const tracks = get().tracks;
                const trackIndex = tracks.findIndex(t => t.id === trackId);

                if (trackIndex === -1) return;

                const newTracks = [...tracks];
                newTracks[trackIndex] = { ...newTracks[trackIndex], ...updates };
                set({ tracks: newTracks });
            },

            getTracks: () => get().tracks,

            getTrackById: (id: string) => {
                return get().tracks.find(track => track.id === id);
            },

            searchTracks: (query: string) => {
                const lowerQuery = query.toLowerCase();
                return get().tracks.filter(track =>
                    track.title.toLowerCase().includes(lowerQuery) ||
                    track.artist.toLowerCase().includes(lowerQuery) ||
                    track.album.toLowerCase().includes(lowerQuery)
                );
            },

            clearLibrary: () => {
                set({ tracks: [], lastScanned: null });
            },
        }),
        {
            name: 'audio-vibes-library',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                tracks: state.tracks,
                lastScanned: state.lastScanned,
            }),
        }
    )
);
