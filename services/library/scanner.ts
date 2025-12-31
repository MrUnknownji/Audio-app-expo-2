import * as MediaLibrary from 'expo-media-library';
import * as mm from 'music-metadata';
import { Platform } from 'react-native';
import { Track } from '../audio/types';

const AUDIO_EXTENSIONS = ['.mp3', '.m4a', '.aac', '.wav', '.flac', '.ogg', '.opus', '.wma'];

function isAudioFile(filename: string): boolean {
    const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    return AUDIO_EXTENSIONS.includes(ext);
}

function extractMetadataFromFilename(filename: string): { title: string; artist: string } {
    const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));

    if (nameWithoutExt.includes(' - ')) {
        const [artist, title] = nameWithoutExt.split(' - ', 2);
        return { title: title.trim(), artist: artist.trim() };
    }

    return { title: nameWithoutExt, artist: 'Unknown Artist' };
}

function getMimeType(filename: string): string {
    const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    const mimeTypes: Record<string, string> = {
        '.mp3': 'audio/mpeg',
        '.m4a': 'audio/mp4',
        '.aac': 'audio/aac',
        '.wav': 'audio/wav',
        '.flac': 'audio/flac',
        '.ogg': 'audio/ogg',
        '.opus': 'audio/opus',
        '.wma': 'audio/x-ms-wma',
    };
    return mimeTypes[ext] || 'audio/mpeg';
}

// Helper: Convert Blob to Uint8Array using FileReader (React Native compatible)
function blobToUint8Array(blob: Blob): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (reader.result instanceof ArrayBuffer) {
                resolve(new Uint8Array(reader.result));
            } else {
                reject(new Error('FileReader did not return ArrayBuffer'));
            }
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(blob);
    });
}

// Helper: Convert Uint8Array to base64 (React Native compatible)
function uint8ArrayToBase64(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

export async function requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
        const androidVersion = Platform.Version as number;

        if (androidVersion >= 33) {
            const { status } = await MediaLibrary.requestPermissionsAsync();
            return status === 'granted';
        } else {
            const { status } = await MediaLibrary.requestPermissionsAsync();
            return status === 'granted';
        }
    } else {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        return status === 'granted';
    }
}

export async function checkPermissions(): Promise<boolean> {
    const { status } = await MediaLibrary.getPermissionsAsync();
    return status === 'granted';
}

async function extractMetadataFromUri(contentUri: string, filename: string): Promise<{
    title?: string;
    artist?: string;
    album?: string;
    artwork?: string;
}> {
    try {
        console.log('[Metadata] Fetching:', contentUri);

        // Fetch the audio file as blob
        const response = await fetch(contentUri);
        if (!response.ok) {
            console.log('[Metadata] Fetch failed:', response.status);
            return {};
        }

        const blob = await response.blob();
        console.log('[Metadata] Blob size:', blob.size);

        // Convert blob to Uint8Array using FileReader (React Native compatible)
        const uint8Array = await blobToUint8Array(blob);
        console.log('[Metadata] Uint8Array size:', uint8Array.length);

        // Parse metadata using music-metadata
        const mimeType = getMimeType(filename);
        const metadata = await mm.parseBuffer(uint8Array, { mimeType });

        console.log('[Metadata] Parsed. Title:', metadata.common.title, 'Artist:', metadata.common.artist);
        console.log('[Metadata] Has picture:', !!metadata.common.picture?.length);

        let artwork: string | undefined;

        if (metadata.common.picture && metadata.common.picture.length > 0) {
            const picture = metadata.common.picture[0];
            // Convert picture data to base64 data URI
            const base64 = uint8ArrayToBase64(new Uint8Array(picture.data));
            artwork = `data:${picture.format};base64,${base64}`;
            console.log('[Metadata] Artwork extracted, length:', artwork.length);
        }

        return {
            title: metadata.common.title,
            artist: metadata.common.artist,
            album: metadata.common.album,
            artwork,
        };
    } catch (error) {
        console.error('[Metadata] Error:', error);
        return {};
    }
}

export interface ScanOptions {
    onProgress?: (scanned: number, total: number, phase: 'scanning' | 'metadata') => void;
    extractMetadata?: boolean;
}

export async function scanLibrary(options?: ScanOptions): Promise<Track[]> {
    const hasPermission = await checkPermissions();
    if (!hasPermission) {
        const granted = await requestPermissions();
        if (!granted) {
            throw new Error('Media library permission denied');
        }
    }

    const tracks: Track[] = [];
    const assets: MediaLibrary.Asset[] = [];
    let hasMore = true;
    let endCursor: string | undefined;

    // Phase 1: Collect all audio assets
    while (hasMore) {
        const page = await MediaLibrary.getAssetsAsync({
            mediaType: MediaLibrary.MediaType.audio,
            first: 100,
            after: endCursor,
            sortBy: [MediaLibrary.SortBy.modificationTime],
        });

        for (const asset of page.assets) {
            if (isAudioFile(asset.filename)) {
                assets.push(asset);
            }
        }

        if (options?.onProgress) {
            options.onProgress(assets.length, page.totalCount, 'scanning');
        }

        hasMore = page.hasNextPage;
        endCursor = page.endCursor;
    }

    console.log('[Scan] Found', assets.length, 'audio files');

    // Phase 2: Get detailed info and extract metadata
    const shouldExtractMetadata = options?.extractMetadata !== false;

    for (let i = 0; i < assets.length; i++) {
        const asset = assets[i];
        const { title, artist } = extractMetadataFromFilename(asset.filename);

        let artwork: string | undefined;
        let extractedTitle = title;
        let extractedArtist = artist;
        let extractedAlbum = 'Unknown Album';

        // Extract metadata using content URI
        if (shouldExtractMetadata) {
            console.log('[Scan] Processing:', asset.filename, 'URI:', asset.uri);

            const metadata = await extractMetadataFromUri(asset.uri, asset.filename);

            if (metadata.title) extractedTitle = metadata.title;
            if (metadata.artist) extractedArtist = metadata.artist;
            if (metadata.album) extractedAlbum = metadata.album;
            if (metadata.artwork) {
                artwork = metadata.artwork;
                console.log('[Scan] Artwork found for:', asset.filename);
            }
        }

        tracks.push({
            id: asset.id,
            uri: asset.uri,
            title: extractedTitle,
            artist: extractedArtist,
            album: extractedAlbum,
            duration: asset.duration * 1000,
            artwork,
            filename: asset.filename,
            createdAt: asset.creationTime,
            modifiedAt: asset.modificationTime,
        });

        if (options?.onProgress) {
            options.onProgress(i + 1, assets.length, 'metadata');
        }
    }

    const withArtwork = tracks.filter(t => t.artwork).length;
    console.log('[Scan] Complete. Tracks:', tracks.length, 'With artwork:', withArtwork);

    return tracks;
}

export async function getAssetInfo(id: string): Promise<MediaLibrary.AssetInfo | null> {
    try {
        const asset = await MediaLibrary.getAssetInfoAsync(id);
        return asset;
    } catch {
        return null;
    }
}
