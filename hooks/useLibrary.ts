import { useCallback, useMemo } from 'react';
import { useLibraryStore } from '@/stores/libraryStore';
import { Track, LibraryFilters } from '@/services/audio/types';

export function useLibrary(filters?: Partial<LibraryFilters>) {
    const store = useLibraryStore();

    const sortedTracks = useMemo(() => {
        let tracks = [...store.tracks];

        if (filters?.search) {
            const query = filters.search.toLowerCase();
            tracks = tracks.filter(track =>
                track.title.toLowerCase().includes(query) ||
                track.artist.toLowerCase().includes(query) ||
                track.album.toLowerCase().includes(query)
            );
        }

        const sortBy = filters?.sortBy || 'title';
        const sortOrder = filters?.sortOrder || 'asc';

        tracks.sort((a, b) => {
            let comparison = 0;

            switch (sortBy) {
                case 'title':
                    comparison = a.title.localeCompare(b.title);
                    break;
                case 'artist':
                    comparison = a.artist.localeCompare(b.artist);
                    break;
                case 'album':
                    comparison = a.album.localeCompare(b.album);
                    break;
                case 'duration':
                    comparison = a.duration - b.duration;
                    break;
                case 'recent':
                    comparison = b.modifiedAt - a.modifiedAt;
                    break;
            }

            return sortOrder === 'asc' ? comparison : -comparison;
        });

        return tracks;
    }, [store.tracks, filters?.search, filters?.sortBy, filters?.sortOrder]);

    const scan = useCallback(async () => {
        await store.scan();
    }, []);

    const formatLastScanned = useCallback(() => {
        if (!store.lastScanned) return 'Never';

        const now = Date.now();
        const diff = now - store.lastScanned;

        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
        return new Date(store.lastScanned).toLocaleDateString();
    }, [store.lastScanned]);

    return {
        tracks: sortedTracks,
        allTracks: store.tracks,
        trackCount: store.tracks.length,
        isScanning: store.isScanning,
        scanProgress: store.scanProgress,
        lastScanned: store.lastScanned,
        error: store.error,

        scan,
        getTrackById: store.getTrackById,
        searchTracks: store.searchTracks,
        clearLibrary: store.clearLibrary,
        formatLastScanned,

        // Selection
        selectedTracks: store.selectedTracks,
        isSelectionMode: store.isSelectionMode,
        toggleSelectionMode: store.toggleSelectionMode,
        toggleTrackSelection: store.toggleTrackSelection,
        selectAll: store.selectAll,
        clearSelection: store.clearSelection,
    };
}
