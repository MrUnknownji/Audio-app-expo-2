import * as FileSystem from 'expo-file-system';
import { parseBuffer } from 'music-metadata-browser';
import { Buffer } from 'buffer';
import { Track } from '../audio/types';

export interface ExtractedMetadata {
    title?: string;
    artist?: string;
    album?: string;
    artwork?: string;
    genre?: string;
    year?: number;
}

async function fileUriToBase64(uri: string): Promise<string | null> {
    try {
        const base64 = await FileSystem.readAsStringAsync(uri, {
            encoding: 'base64',
        });
        return base64;
    } catch (error) {
        console.warn('Failed to read file as base64:', error);
        return null;
    }
}

export async function extractMetadata(fileUri: string): Promise<ExtractedMetadata | null> {
    try {
        const base64Content = await fileUriToBase64(fileUri);
        if (!base64Content) return null;

        const buffer = Buffer.from(base64Content, 'base64');
        const metadata = await parseBuffer(buffer);

        let artworkDataUri: string | undefined;

        if (metadata.common.picture && metadata.common.picture.length > 0) {
            const picture = metadata.common.picture[0];
            const base64Art = Buffer.from(picture.data).toString('base64');
            artworkDataUri = `data:${picture.format};base64,${base64Art}`;
        }

        return {
            title: metadata.common.title,
            artist: metadata.common.artist,
            album: metadata.common.album,
            artwork: artworkDataUri,
            genre: metadata.common.genre?.[0],
            year: metadata.common.year,
        };
    } catch (error) {
        console.warn('Failed to extract metadata:', error);
        return null;
    }
}

export async function enrichTrackWithMetadata(track: Track): Promise<Track> {
    const metadata = await extractMetadata(track.uri);

    if (!metadata) return track;

    return {
        ...track,
        title: metadata.title || track.title,
        artist: metadata.artist || track.artist,
        album: metadata.album || track.album,
        artwork: metadata.artwork || track.artwork,
    };
}

export async function enrichTracksWithMetadata(
    tracks: Track[],
    onProgress?: (current: number, total: number) => void
): Promise<Track[]> {
    const enrichedTracks: Track[] = [];

    for (let i = 0; i < tracks.length; i++) {
        const enriched = await enrichTrackWithMetadata(tracks[i]);
        enrichedTracks.push(enriched);

        if (onProgress) {
            onProgress(i + 1, tracks.length);
        }
    }

    return enrichedTracks;
}
