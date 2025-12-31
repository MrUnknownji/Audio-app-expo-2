import React from 'react';
import { View, StyleSheet, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Theme } from '@/constants/theme';
import { Title, Heading, Body, Caption } from '@/components/ui';
import { TrackItem } from '@/components/player';
import { usePlayer } from '@/hooks/usePlayer';
import { useTheme } from '@/hooks/useTheme';

export default function QueueScreen() {
    const { colors } = useTheme();
    const {
        queue,
        queueIndex,
        currentTrack,
        isPlaying,
        playTrack,
        removeFromQueue,
        clearQueue,
    } = usePlayer();

    const upNext = queue.slice(queueIndex + 1);
    const played = queue.slice(0, queueIndex);

    const handleTrackPress = async (index: number) => {
        await playTrack(queue[index]);
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <SafeAreaView style={styles.safeArea}>
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                    <Pressable onPress={() => router.back()} style={styles.closeButton}>
                        <Ionicons name="close" size={24} color={colors.text} />
                    </Pressable>
                    <Title>Queue</Title>
                    <Pressable onPress={clearQueue} style={styles.clearButton}>
                        <Caption color={colors.error}>Clear</Caption>
                    </Pressable>
                </View>

                {currentTrack && (
                    <View style={styles.nowPlaying}>
                        <Caption style={styles.sectionLabel}>NOW PLAYING</Caption>
                        <TrackItem
                            track={currentTrack}
                            isActive
                            isPlaying={isPlaying}
                            onPress={() => router.push('/player')}
                        />
                    </View>
                )}

                {upNext.length > 0 && (
                    <View style={styles.section}>
                        <Caption style={styles.sectionLabel}>UP NEXT</Caption>
                        <FlatList
                            data={upNext}
                            renderItem={({ item, index }) => (
                                <TrackItem
                                    track={item}
                                    isActive={false}
                                    isPlaying={false}
                                    onPress={() => handleTrackPress(queueIndex + 1 + index)}
                                />
                            )}
                            keyExtractor={(item, index) => `${item.id}-${index}`}
                            showsVerticalScrollIndicator={false}
                        />
                    </View>
                )}

                {queue.length === 0 && (
                    <View style={styles.empty}>
                        <Ionicons name="list" size={48} color={colors.textMuted} />
                        <Body color={colors.textSecondary}>Queue is empty</Body>
                        <Caption color={colors.textMuted}>
                            Play a song to start the queue
                        </Caption>
                    </View>
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
        justifyContent: 'space-between',
        paddingHorizontal: Theme.spacing.md,
        paddingVertical: Theme.spacing.md,
        borderBottomWidth: 1,
    },
    closeButton: {
        padding: Theme.spacing.sm,
    },
    clearButton: {
        padding: Theme.spacing.sm,
    },
    nowPlaying: {
        paddingHorizontal: Theme.spacing.sm,
        paddingTop: Theme.spacing.md,
    },
    section: {
        flex: 1,
        paddingHorizontal: Theme.spacing.sm,
    },
    sectionLabel: {
        paddingHorizontal: Theme.spacing.md,
        paddingVertical: Theme.spacing.sm,
        letterSpacing: 1,
    },
    empty: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: Theme.spacing.sm,
    },
});
