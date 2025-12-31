import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Playlist, PlaylistState } from '@/services/audio/types';

function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

interface PlaylistStore extends PlaylistState {
    createPlaylist: (name: string, description?: string) => Playlist;
    deletePlaylist: (id: string) => void;
    updatePlaylist: (id: string, updates: Partial<Omit<Playlist, 'id' | 'createdAt'>>) => void;
    addTrackToPlaylist: (playlistId: string, trackId: string) => void;
    removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
    reorderPlaylistTracks: (playlistId: string, fromIndex: number, toIndex: number) => void;
    getPlaylist: (id: string) => Playlist | undefined;
    toggleFavorite: (trackId: string) => void;
    isFavorite: (trackId: string) => boolean;
    exportPlaylist: (id: string) => string | null;
    importPlaylist: (json: string) => Playlist | null;
}

export const usePlaylistStore = create<PlaylistStore>()(
    persist(
        (set, get) => ({
            playlists: [],
            favorites: [],

            createPlaylist: (name: string, description?: string) => {
                const newPlaylist: Playlist = {
                    id: generateId(),
                    name,
                    description,
                    trackIds: [],
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                };

                set(state => ({
                    playlists: [...state.playlists, newPlaylist],
                }));

                return newPlaylist;
            },

            deletePlaylist: (id: string) => {
                set(state => ({
                    playlists: state.playlists.filter(p => p.id !== id),
                }));
            },

            updatePlaylist: (id: string, updates: Partial<Omit<Playlist, 'id' | 'createdAt'>>) => {
                set(state => ({
                    playlists: state.playlists.map(p =>
                        p.id === id
                            ? { ...p, ...updates, updatedAt: Date.now() }
                            : p
                    ),
                }));
            },

            addTrackToPlaylist: (playlistId: string, trackId: string) => {
                set(state => ({
                    playlists: state.playlists.map(p =>
                        p.id === playlistId && !p.trackIds.includes(trackId)
                            ? { ...p, trackIds: [...p.trackIds, trackId], updatedAt: Date.now() }
                            : p
                    ),
                }));
            },

            removeTrackFromPlaylist: (playlistId: string, trackId: string) => {
                set(state => ({
                    playlists: state.playlists.map(p =>
                        p.id === playlistId
                            ? { ...p, trackIds: p.trackIds.filter(id => id !== trackId), updatedAt: Date.now() }
                            : p
                    ),
                }));
            },

            reorderPlaylistTracks: (playlistId: string, fromIndex: number, toIndex: number) => {
                set(state => ({
                    playlists: state.playlists.map(p => {
                        if (p.id !== playlistId) return p;

                        const newTrackIds = [...p.trackIds];
                        const [removed] = newTrackIds.splice(fromIndex, 1);
                        newTrackIds.splice(toIndex, 0, removed);

                        return { ...p, trackIds: newTrackIds, updatedAt: Date.now() };
                    }),
                }));
            },

            getPlaylist: (id: string) => {
                return get().playlists.find(p => p.id === id);
            },

            toggleFavorite: (trackId: string) => {
                set(state => ({
                    favorites: state.favorites.includes(trackId)
                        ? state.favorites.filter(id => id !== trackId)
                        : [...state.favorites, trackId],
                }));
            },

            isFavorite: (trackId: string) => {
                return get().favorites.includes(trackId);
            },

            exportPlaylist: (id: string) => {
                const playlist = get().playlists.find(p => p.id === id);
                if (!playlist) return null;
                return JSON.stringify({
                    name: playlist.name,
                    description: playlist.description,
                    trackIds: playlist.trackIds,
                    exportedAt: Date.now(),
                    version: 1,
                });
            },

            importPlaylist: (json: string) => {
                try {
                    const data = JSON.parse(json);
                    if (!data.name || !Array.isArray(data.trackIds)) return null;

                    const newPlaylist: Playlist = {
                        id: generateId(),
                        name: data.name + ' (Imported)',
                        description: data.description,
                        trackIds: data.trackIds,
                        createdAt: Date.now(),
                        updatedAt: Date.now(),
                    };

                    set(state => ({
                        playlists: [...state.playlists, newPlaylist],
                    }));

                    return newPlaylist;
                } catch {
                    return null;
                }
            },
        }),
        {
            name: 'audio-vibes-playlists',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
