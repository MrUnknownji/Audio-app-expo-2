import React, { useMemo } from 'react';
import { View, StyleSheet, FlatList, Pressable, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Theme } from '@/constants/theme';
import { Title, Body, Caption } from '@/components/ui';
import { TrackItem } from '@/components/player';
import { usePlaylistStore } from '@/stores/playlistStore';
import { useLibraryStore } from '@/stores/libraryStore';
import { usePlayer } from '@/hooks/usePlayer';
import { useTheme } from '@/hooks/useTheme';
import { Track } from '@/services/audio/types';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export default function PlaylistDetailScreen() {
    const { colors } = useTheme();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { getPlaylist, deletePlaylist, removeTrackFromPlaylist, exportPlaylist } = usePlaylistStore();
    const { tracks: allTracks } = useLibraryStore();
    const { playQueue, currentTrack, isPlaying } = usePlayer();

    const playlist = getPlaylist(id);

    const tracks = useMemo((): Track[] => {
        if (!playlist) return [];
        return playlist.trackIds
            .map(id => allTracks.find(t => t.id === id))
            .filter((t): t is Track => t !== undefined);
    }, [playlist, allTracks]);

    if (!playlist) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <SafeAreaView style={styles.safeArea}>
                    <Body>Playlist not found</Body>
                </SafeAreaView>
            </View>
        );
    }

    const handlePlayAll = () => {
        if (tracks.length > 0) {
            playQueue(tracks, 0);
        }
    };

    const handleShuffle = () => {
        if (tracks.length > 0) {
            const shuffled = [...tracks].sort(() => Math.random() - 0.5);
            playQueue(shuffled, 0);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Playlist',
            `Are you sure you want to delete "${playlist.name}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        deletePlaylist(playlist.id);
                        router.back();
                    }
                },
            ]
        );
    };

    const handleExport = async () => {
        if (!playlist) return;
        const json = exportPlaylist(playlist.id);
        if (!json) {
            Alert.alert('Error', 'Failed to generate playlist data');
            return;
        }

        const filename = `${playlist.name.replace(/[^a-z0-9]/gi, '_')}.json`;
        const file = new FileSystem.File(FileSystem.Paths.cache, filename);

        try {
            await file.write(json);
            await Sharing.shareAsync(file.uri);
        } catch (error) {
            Alert.alert('Error', 'Failed to share playlist');
        }
    };

    const handleTrackPress = (index: number) => {
        playQueue(tracks, index);
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <LinearGradient
                colors={[`${colors.primary}33`, 'transparent']}
                style={styles.backgroundGradient}
            />

            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <Pressable onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </Pressable>
                    <View style={{ flexDirection: 'row' }}>
                        <Pressable onPress={handleExport} style={styles.menuButton}>
                            <Ionicons name="share-outline" size={22} color={colors.text} />
                        </Pressable>
                        <Pressable onPress={handleDelete} style={styles.menuButton}>
                            <Ionicons name="trash-outline" size={22} color={colors.error} />
                        </Pressable>
                    </View>
                </View>

                <View style={styles.info}>
                    <View style={[styles.artwork, { backgroundColor: colors.primaryMuted }]}>
                        <Ionicons name="musical-notes" size={48} color={colors.primary} />
                    </View>
                    <Title style={styles.title}>{playlist.name}</Title>
                    <Caption>{tracks.length} songs</Caption>
                </View>

                <View style={styles.actions}>
                    <Pressable
                        style={[styles.shuffleButton, { borderColor: colors.border }]}
                        onPress={handleShuffle}
                    >
                        <Ionicons name="shuffle" size={20} color={colors.text} />
                        <Body style={{ color: colors.text, fontWeight: '600' }}>Shuffle</Body>
                    </Pressable>
                    <Pressable style={styles.playButton} onPress={handlePlayAll}>
                        <LinearGradient
                            colors={[colors.primary, '#A855F7']}
                            style={styles.playButtonGradient}
                        >
                            <Ionicons name="play" size={24} color={colors.text} />
                            <Body style={{ color: colors.text, fontWeight: '600' }}>Play All</Body>
                        </LinearGradient>
                    </Pressable>
                </View>

                {tracks.length === 0 ? (
                    <View style={styles.empty}>
                        <Ionicons name="musical-note" size={48} color={colors.textMuted} />
                        <Body color={colors.textSecondary} style={styles.emptyText}>
                            No songs in this playlist
                        </Body>
                    </View>
                ) : (
                    <FlatList
                        data={tracks}
                        renderItem={({ item, index }) => (
                            <TrackItem
                                track={item}
                                isActive={currentTrack?.id === item?.id}
                                isPlaying={currentTrack?.id === item?.id && isPlaying}
                                onPress={() => handleTrackPress(index)}
                            />
                        )}
                        keyExtractor={(item) => item?.id || ''}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    backgroundGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 300,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: Theme.spacing.md,
        paddingVertical: Theme.spacing.sm,
    },
    backButton: {
        padding: Theme.spacing.sm,
    },
    menuButton: {
        padding: Theme.spacing.sm,
    },
    info: {
        alignItems: 'center',
        paddingVertical: Theme.spacing.lg,
    },
    artwork: {
        width: 120,
        height: 120,
        borderRadius: Theme.borderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Theme.spacing.md,
    },
    title: {
        marginBottom: Theme.spacing.xs,
    },
    actions: {
        flexDirection: 'row',
        paddingHorizontal: Theme.spacing.lg,
        gap: Theme.spacing.md,
        marginBottom: Theme.spacing.lg,
    },
    shuffleButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Theme.spacing.sm,
        paddingVertical: Theme.spacing.md,
        borderRadius: Theme.borderRadius.full,
        borderWidth: 1,
    },
    playButton: {
        flex: 1,
        borderRadius: Theme.borderRadius.full,
        overflow: 'hidden',
    },
    playButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Theme.spacing.sm,
        paddingVertical: Theme.spacing.md,
    },
    empty: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: Theme.spacing.md,
    },
    emptyText: {
        textAlign: 'center',
    },
    listContent: {
        paddingHorizontal: Theme.spacing.sm,
        paddingBottom: 100,
    },
});
