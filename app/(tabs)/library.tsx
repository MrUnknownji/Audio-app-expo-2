import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Pressable, FlatList, RefreshControl, ActivityIndicator, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Theme } from '@/constants/theme';
import { ColorTokens } from '@/constants/colors';
import { Title, Body, Caption } from '@/components/ui';
import { TrackItem } from '@/components/player';
import { useLibrary } from '@/hooks/useLibrary';
import { usePlayer } from '@/hooks/usePlayer';
import { useTheme } from '@/hooks/useTheme';
import { usePlaylistStore } from '@/stores/playlistStore';
import { Track } from '@/services/audio/types';
import { AddToPlaylistModal } from '@/components/playlist';
import * as Haptics from 'expo-haptics';

type FilterType = 'all' | 'albums' | 'artists' | 'recent' | 'favorites';

function FilterChip({
    label,
    active,
    icon,
    onPress,
    colors
}: {
    label: string;
    active?: boolean;
    icon?: keyof typeof Ionicons.glyphMap;
    onPress?: () => void;
    colors: ColorTokens;
}) {
    return (
        <Pressable
            style={[
                styles.filterChip,
                {
                    backgroundColor: colors.surfaceGlass,
                    borderColor: colors.border
                },
                active && {
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                }
            ]}
            onPress={onPress}
        >
            {icon && <Ionicons name={icon} size={16} color={active ? colors.text : colors.textSecondary} />}
            <Caption color={active ? colors.text : colors.textSecondary}>{label}</Caption>
        </Pressable>
    );
}

function LibraryEmptyState({ onScan, isScanning, scanProgress, colors }: {
    onScan: () => void;
    isScanning: boolean;
    scanProgress: number;
    colors: ColorTokens;
}) {
    return (
        <View style={styles.emptyState}>
            <View style={[styles.emptyIconContainer, { backgroundColor: colors.primaryMuted }]}>
                {isScanning ? (
                    <ActivityIndicator size="large" color={colors.primary} />
                ) : (
                    <Ionicons name="library" size={64} color={colors.primary} />
                )}
            </View>

            {isScanning ? (
                <>
                    <Title style={styles.emptyTitle}>Scanning Library...</Title>
                    <Body color={colors.textSecondary} style={styles.emptyText}>
                        {scanProgress}% complete
                    </Body>
                </>
            ) : (
                <>
                    <Title style={styles.emptyTitle}>No Music Yet</Title>
                    <Body color={colors.textSecondary} style={styles.emptyText}>
                        Your library is empty. Scan your device to discover your music collection.
                    </Body>
                </>
            )}

            <Pressable
                style={[
                    styles.primaryButton,
                    isScanning && styles.disabled
                ]}
                onPress={onScan}
                disabled={isScanning}
            >
                <LinearGradient
                    colors={[colors.primary, '#A855F7']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.primaryButtonGradient}
                >
                    <Ionicons name="scan" size={20} color={colors.text} />
                    <Body style={{ color: colors.text, fontWeight: '600', marginLeft: 8 }}>
                        {isScanning ? 'Scanning...' : 'Scan Device'}
                    </Body>
                </LinearGradient>
            </Pressable>
        </View>
    );
}

export default function LibraryScreen() {
    const { colors } = useTheme();
    const { tracks, isScanning, scanProgress, scan, formatLastScanned, selectedTracks, isSelectionMode, toggleSelectionMode, toggleTrackSelection, selectAll, clearSelection } = useLibrary();
    const { playQueue, currentTrack, isPlaying } = usePlayer();
    const { favorites } = usePlaylistStore();
    const [refreshing, setRefreshing] = useState(false);
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
    const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);

    const filteredTracks = useMemo(() => {
        let result = [...tracks];

        switch (activeFilter) {
            case 'favorites':
                result = result.filter(t => favorites.includes(t.id));
                break;
            case 'recent':
                result = result.sort((a, b) => b.modifiedAt - a.modifiedAt);
                break;
            case 'albums':
                result = result.sort((a, b) => a.album.localeCompare(b.album));
                break;
            case 'artists':
                result = result.sort((a, b) => a.artist.localeCompare(b.artist));
                break;
            case 'all':
            default:
                break;
        }

        return result;
    }, [tracks, activeFilter, favorites]);

    const handleScan = useCallback(async () => {
        await scan();
    }, [scan]);

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await scan();
        setRefreshing(false);
    }, [scan]);

    const handleTrackPress = useCallback((track: Track, index: number) => {
        if (isSelectionMode) {
            toggleTrackSelection(track.id);
            if (Platform.OS !== 'web') Haptics.selectionAsync();
        } else {
            playQueue(filteredTracks, index);
        }
    }, [filteredTracks, playQueue, isSelectionMode, toggleTrackSelection]);

    const handleTrackLongPress = useCallback((track: Track) => {
        if (!isSelectionMode) {
            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            toggleSelectionMode();
            toggleTrackSelection(track.id);
        }
    }, [isSelectionMode, toggleSelectionMode, toggleTrackSelection]);

    const handleSearchPress = useCallback(() => {
        router.push('/search');
    }, []);

    const renderTrack = useCallback(({ item, index }: { item: Track; index: number }) => {
        const isActive = currentTrack?.id === item.id;
        const isSelected = selectedTracks.includes(item.id);

        return (
            <TrackItem
                track={item}
                isActive={isActive}
                isPlaying={isActive && isPlaying}
                onPress={() => handleTrackPress(item, index)}
                onLongPress={() => handleTrackLongPress(item)}
                isSelectionMode={isSelectionMode}
                isSelected={isSelected}
            />
        );
    }, [currentTrack, isPlaying, handleTrackPress, handleTrackLongPress, selectedTracks, isSelectionMode]);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>

            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <View style={styles.header}>
                    <View>
                        <Title>Library</Title>
                        {tracks.length > 0 && (
                            <Caption>{tracks.length} songs · {formatLastScanned()}</Caption>
                        )}
                    </View>
                    <View style={styles.headerActions}>
                        <Pressable
                            style={[
                                styles.iconButton,
                                { backgroundColor: colors.surfaceGlass, borderColor: colors.border }
                            ]}
                            onPress={handleScan}
                        >
                            <Ionicons name="refresh" size={22} color={colors.text} />
                        </Pressable>
                        <Pressable
                            style={[
                                styles.iconButton,
                                { backgroundColor: colors.surfaceGlass, borderColor: colors.border }
                            ]}
                            onPress={handleSearchPress}
                        >
                            <Ionicons name="search" size={22} color={colors.text} />
                        </Pressable>
                    </View>
                </View>

                {tracks.length > 0 && (
                    <View style={[styles.filters, { borderBottomColor: colors.border }]}>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.filtersContent}
                        >
                            <FilterChip
                                label="All"
                                active={activeFilter === 'all'}
                                onPress={() => setActiveFilter('all')}
                                colors={colors}
                            />
                            <FilterChip
                                label="Albums"
                                icon="disc"
                                active={activeFilter === 'albums'}
                                onPress={() => setActiveFilter('albums')}
                                colors={colors}
                            />
                            <FilterChip
                                label="Artists"
                                icon="person"
                                active={activeFilter === 'artists'}
                                onPress={() => setActiveFilter('artists')}
                                colors={colors}
                            />
                            <FilterChip
                                label="Recent"
                                icon="time"
                                active={activeFilter === 'recent'}
                                onPress={() => setActiveFilter('recent')}
                                colors={colors}
                            />
                            <FilterChip
                                label="Favorites"
                                icon="heart"
                                active={activeFilter === 'favorites'}
                                onPress={() => setActiveFilter('favorites')}
                                colors={colors}
                            />
                        </ScrollView>
                    </View>
                )}

                {tracks.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <LibraryEmptyState
                            onScan={handleScan}
                            isScanning={isScanning}
                            scanProgress={scanProgress}
                            colors={colors}
                        />
                    </View>
                ) : filteredTracks.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyState}>
                            <Ionicons name="heart-outline" size={64} color={colors.textMuted} />
                            <Title style={styles.emptyTitle}>No Favorites Yet</Title>
                            <Body color={colors.textSecondary} style={styles.emptyText}>
                                Tap the heart icon on any song to add it to your favorites.
                            </Body>
                        </View>
                    </View>
                ) : (
                    <FlatList
                        data={filteredTracks}
                        renderItem={renderTrack}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={handleRefresh}
                                tintColor={colors.primary}
                            />
                        }
                    />
                )}
            </SafeAreaView>

            {isSelectionMode && (
                <View style={[
                    styles.batchActionBar,
                    {
                        backgroundColor: colors.surface,
                        bottom: 160, // Above MiniPlayer (68) + TabBar (~88) + margin
                    }
                ]}>
                    <View style={styles.batchInfo}>
                        <Pressable onPress={() => {
                            clearSelection();
                            toggleSelectionMode();
                        }}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </Pressable>
                        <Body>{selectedTracks.length} selected</Body>
                    </View>
                    <View style={styles.batchActions}>
                        <Pressable onPress={selectAll}>
                            <Ionicons name="checkmark-done" size={24} color={colors.text} />
                        </Pressable>
                        <Pressable onPress={() => setShowAddToPlaylist(true)} disabled={selectedTracks.length === 0}>
                            <Ionicons name="add-circle-outline" size={24} color={selectedTracks.length > 0 ? colors.primary : colors.textMuted} />
                        </Pressable>
                    </View>
                </View>
            )}

            <AddToPlaylistModal
                visible={showAddToPlaylist}
                trackIds={selectedTracks}
                onClose={() => {
                    setShowAddToPlaylist(false);
                    clearSelection();
                    toggleSelectionMode();
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    batchActionBar: {
        position: 'absolute',
        left: Theme.spacing.md,
        right: Theme.spacing.md,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Theme.spacing.lg,
        paddingVertical: Theme.spacing.md,
        borderRadius: Theme.borderRadius.lg,
        elevation: 20,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        zIndex: 1000,
    },
    batchInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Theme.spacing.md,
    },
    batchActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Theme.spacing.xl,
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
        alignItems: 'flex-start',
        paddingHorizontal: Theme.spacing.lg,
        paddingTop: Theme.spacing.lg,
        paddingBottom: Theme.spacing.md,
    },
    headerActions: {
        flexDirection: 'row',
        gap: Theme.spacing.xs,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: Theme.borderRadius.full,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    filters: {
        borderBottomWidth: 1,
    },
    filtersContent: {
        paddingHorizontal: Theme.spacing.lg,
        paddingBottom: Theme.spacing.md,
        gap: Theme.spacing.sm,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Theme.spacing.xs,
        paddingVertical: Theme.spacing.sm,
        paddingHorizontal: Theme.spacing.md,
        borderRadius: Theme.borderRadius.full,
        borderWidth: 1,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    emptyState: {
        alignItems: 'center',
        paddingHorizontal: Theme.spacing.xl,
    },
    emptyIconContainer: {
        width: 120,
        height: 120,
        borderRadius: Theme.borderRadius.full,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Theme.spacing.xl,
    },
    emptyTitle: {
        marginBottom: Theme.spacing.sm,
        textAlign: 'center',
    },
    emptyText: {
        textAlign: 'center',
        marginBottom: Theme.spacing.xl,
    },
    primaryButton: {
        borderRadius: Theme.borderRadius.full,
        overflow: 'hidden',
    },
    disabled: {
        opacity: 0.7,
    },
    primaryButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Theme.spacing.md,
        paddingHorizontal: Theme.spacing.xl,
    },
    listContent: {
        paddingHorizontal: Theme.spacing.sm,
        paddingBottom: 100,
    },
});
