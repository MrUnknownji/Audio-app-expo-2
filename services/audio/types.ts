export interface Track {
    id: string;
    uri: string;
    title: string;
    artist: string;
    album: string;
    duration: number;
    artwork?: string;
    filename: string;
    createdAt: number;
    modifiedAt: number;
}

export interface PlayerState {
    currentTrack: Track | null;
    queue: Track[];
    queueIndex: number;
    isPlaying: boolean;
    isLoading: boolean;
    position: number;
    duration: number;
    volume: number;
    isMuted: boolean;
    repeatMode: RepeatMode;
    isShuffled: boolean;
}

export type RepeatMode = 'off' | 'one' | 'all';

export interface PlayerControls {
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
}

export interface LibraryState {
    tracks: Track[];
    isScanning: boolean;
    scanProgress: number;
    lastScanned: number | null;
    error: string | null;
}

export interface LibraryFilters {
    search: string;
    sortBy: 'title' | 'artist' | 'album' | 'duration' | 'recent';
    sortOrder: 'asc' | 'desc';
}

export interface Playlist {
    id: string;
    name: string;
    description?: string;
    trackIds: string[];
    createdAt: number;
    updatedAt: number;
    artwork?: string;
}

export interface PlaylistState {
    playlists: Playlist[];
    favorites: string[];
}
