import React, { useState, useMemo, useCallback } from 'react';
import { View, StyleSheet, TextInput, FlatList, Pressable, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Theme } from '@/constants/theme';
import { Heading, Body, Caption } from '@/components/ui';
import { TrackItem } from '@/components/player';
import { useLibrary } from '@/hooks/useLibrary';
import { usePlayer } from '@/hooks/usePlayer';
import { useTheme } from '@/hooks/useTheme';
import { Track } from '@/services/audio/types';

export default function SearchScreen() {
    const { colors } = useTheme();
    const [query, setQuery] = useState('');
    const { tracks } = useLibrary();
    const { playQueue, currentTrack, isPlaying } = usePlayer();

    const results = useMemo(() => {
        if (!query.trim()) return [];

        const q = query.toLowerCase();
        return tracks.filter(track =>
            track.title.toLowerCase().includes(q) ||
            track.artist.toLowerCase().includes(q) ||
            track.album.toLowerCase().includes(q)
        ).slice(0, 50);
    }, [query, tracks]);

    const handleTrackPress = useCallback((track: Track, index: number) => {
        playQueue(results, index);
    }, [results, playQueue]);

    const handleClear = () => {
        setQuery('');
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <SafeAreaView style={styles.safeArea}>
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                    <Pressable onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </Pressable>

                    <View style={[styles.searchContainer, { backgroundColor: colors.surfaceElevated }]}>
                        <Ionicons name="search" size={20} color={colors.textMuted} />
                        <TextInput
                            style={[styles.input, { color: colors.text }]}
                            placeholder="Search songs, artists, albums..."
                            placeholderTextColor={colors.textMuted}
                            value={query}
                            onChangeText={setQuery}
                            autoFocus
                            returnKeyType="search"
                        />
                        {query.length > 0 && (
                            <Pressable onPress={handleClear}>
                                <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                            </Pressable>
                        )}
                    </View>
                </View>

                {query.trim() === '' ? (
                    <View style={styles.empty}>
                        <Ionicons name="search" size={64} color={colors.textMuted} />
                        <Body color={colors.textSecondary}>Search your library</Body>
                        <Caption color={colors.textMuted}>
                            Find songs by title, artist, or album
                        </Caption>
                    </View>
                ) : results.length === 0 ? (
                    <View style={styles.empty}>
                        <Ionicons name="musical-note" size={64} color={colors.textMuted} />
                        <Body color={colors.textSecondary}>No results found</Body>
                        <Caption color={colors.textMuted}>
                            Try a different search term
                        </Caption>
                    </View>
                ) : (
                    <>
                        <View style={styles.resultsHeader}>
                            <Caption>{results.length} results</Caption>
                        </View>
                        <FlatList
                            data={results}
                            renderItem={({ item, index }) => (
                                <TrackItem
                                    track={item}
                                    isActive={currentTrack?.id === item.id}
                                    isPlaying={currentTrack?.id === item.id && isPlaying}
                                    onPress={() => handleTrackPress(item, index)}
                                />
                            )}
                            keyExtractor={item => item.id}
                            contentContainerStyle={styles.listContent}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                            onScrollBeginDrag={Keyboard.dismiss}
                        />
                    </>
                )}
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Theme.spacing.md,
        paddingVertical: Theme.spacing.sm,
        gap: Theme.spacing.sm,
        borderBottomWidth: 1,
    },
    backButton: {
        padding: Theme.spacing.sm,
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: Theme.borderRadius.full,
        paddingHorizontal: Theme.spacing.md,
        gap: Theme.spacing.sm,
    },
    input: {
        flex: 1,
        fontSize: 16,
        paddingVertical: Theme.spacing.sm + 2,
    },
    resultsHeader: {
        paddingHorizontal: Theme.spacing.lg,
        paddingVertical: Theme.spacing.sm,
    },
    listContent: {
        paddingHorizontal: Theme.spacing.sm,
        paddingBottom: 100,
    },
    empty: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: Theme.spacing.sm,
    },
});
