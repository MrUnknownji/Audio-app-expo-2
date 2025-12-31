import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Theme } from '@/constants/theme';
import { ColorTokens } from '@/constants/colors';
import { Hero, Title, Heading, Body, Caption, GlassCard } from '@/components/ui';
import { useLibrary } from '@/hooks/useLibrary';
import { usePlayer } from '@/hooks/usePlayer';
import { useTheme } from '@/hooks/useTheme';
import { usePlaylistStore } from '@/stores/playlistStore';

function getGreeting(): { text: string; emoji: string } {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
        return { text: 'Good Morning', emoji: '🌅' };
    } else if (hour >= 12 && hour < 17) {
        return { text: 'Good Afternoon', emoji: '☀️' };
    } else if (hour >= 17 && hour < 21) {
        return { text: 'Good Evening', emoji: '🌆' };
    } else {
        return { text: 'Good Night', emoji: '🌙' };
    }
}

function QuickPlayCard({
    title,
    subtitle,
    icon,
    gradient,
    onPress,
    colors,
}: {
    title: string;
    subtitle: string;
    icon: keyof typeof Ionicons.glyphMap;
    gradient: [string, string];
    onPress?: () => void;
    colors: ColorTokens;
}) {
    return (
        <Pressable
            style={({ pressed }) => [styles.quickCard, pressed && styles.pressed]}
            onPress={onPress}
        >
            <LinearGradient
                colors={gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.quickCardGradient}
            >
                <Ionicons name={icon} size={32} color={colors.text} />
                <View style={styles.quickCardText}>
                    <Heading style={{ color: colors.text }}>{title}</Heading>
                    <Caption color={colors.textSecondary}>{subtitle}</Caption>
                </View>
            </LinearGradient>
        </Pressable>
    );
}

function SectionHeader({ title, action, onAction, colors }: {
    title: string;
    action?: string;
    onAction?: () => void;
    colors: ColorTokens;
}) {
    return (
        <View style={styles.sectionHeader}>
            <Heading>{title}</Heading>
            {action && (
                <Pressable onPress={onAction}>
                    <Caption color={colors.primary}>{action}</Caption>
                </Pressable>
            )}
        </View>
    );
}

function EmptyLibraryCard({ onScan, colors }: { onScan: () => void; colors: ColorTokens }) {
    return (
        <GlassCard style={styles.emptyCard} gradient>
            <View style={styles.emptyContent}>
                <View style={[styles.emptyIconContainer, { backgroundColor: colors.primaryMuted }]}>
                    <Ionicons name="musical-notes" size={48} color={colors.primary} />
                </View>
                <Title style={styles.emptyTitle}>Your Library Awaits</Title>
                <Body color={colors.textSecondary} style={styles.emptyText}>
                    Start by adding your music collection.
                </Body>
                <Pressable style={styles.scanButton} onPress={onScan}>
                    <LinearGradient
                        colors={[colors.primary, colors.secondary]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.scanButtonGradient}
                    >
                        <Ionicons name="folder-open" size={20} color={colors.text} />
                        <Body style={{ color: colors.text, marginLeft: 8, fontWeight: '600' }}>
                            Go to Library
                        </Body>
                    </LinearGradient>
                </Pressable>
            </View>
        </GlassCard>
    );
}

function RecentTrackCard({ track, isActive, isPlaying, onPress, colors }: {
    track: any;
    isActive: boolean;
    isPlaying: boolean;
    onPress: () => void;
    colors: ColorTokens;
}) {
    return (
        <Pressable
            style={({ pressed }) => [styles.recentCard, pressed && styles.pressed]}
            onPress={onPress}
        >
            <View style={[
                styles.recentArtwork,
                { backgroundColor: colors.surfaceElevated },
                isActive && { backgroundColor: colors.primaryMuted }
            ]}>
                <Ionicons
                    name={isPlaying ? 'musical-notes' : 'musical-note'}
                    size={24}
                    color={isActive ? colors.primary : colors.textMuted}
                />
            </View>
            <Body numberOfLines={1} style={isActive ? { color: colors.primary } : undefined}>
                {track.title}
            </Body>
            <Caption numberOfLines={1}>{track.artist}</Caption>
        </Pressable>
    );
}

export default function HomeScreen() {
    const { colors } = useTheme();
    const greeting = useMemo(() => getGreeting(), []);
    const { tracks } = useLibrary({ sortBy: 'recent' });
    const { playQueue, currentTrack, isPlaying } = usePlayer();
    const { favorites } = usePlaylistStore();

    const recentTracks = useMemo(() => tracks.slice(0, 10), [tracks]);

    const favoriteTracks = useMemo(() =>
        tracks.filter(t => favorites.includes(t.id)),
        [tracks, favorites]);

    const uniqueArtists = useMemo(() => {
        const artists = new Set(tracks.map(t => t.artist));
        return artists.size;
    }, [tracks]);

    const totalHours = useMemo(() => {
        const totalMs = tracks.reduce((acc, t) => acc + t.duration, 0);
        return Math.round(totalMs / 3600000);
    }, [tracks]);

    const handleShuffleAll = () => {
        if (tracks.length > 0) {
            const shuffled = [...tracks].sort(() => Math.random() - 0.5);
            playQueue(shuffled, 0);
        }
    };

    const handlePlayFavorites = () => {
        if (favoriteTracks.length > 0) {
            playQueue(favoriteTracks, 0);
        }
    };

    const handleGoToLibrary = () => {
        router.push('/library');
    };

    const handleTrackPress = (index: number) => {
        playQueue(recentTracks, index);
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>

            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.header}>
                        <View>
                            <Caption style={styles.greetingEmoji}>{greeting.emoji}</Caption>
                            <Hero style={styles.greeting}>{greeting.text}</Hero>
                            <Body color={colors.textSecondary}>
                                What would you like to listen to?
                            </Body>
                        </View>

                        <Pressable
                            style={[
                                styles.searchButton,
                                { backgroundColor: colors.surfaceGlass, borderColor: colors.border }
                            ]}
                            onPress={() => router.push('/search')}
                        >
                            <Ionicons name="search" size={24} color={colors.text} />
                        </Pressable>
                    </View>

                    <View style={styles.quickActions}>
                        <QuickPlayCard
                            title="Shuffle All"
                            subtitle={`${tracks.length} songs`}
                            icon="shuffle"
                            gradient={[`${colors.primary}4D`, `${colors.primary}1A`]}
                            onPress={handleShuffleAll}
                            colors={colors}
                        />
                        <QuickPlayCard
                            title="Favorites"
                            subtitle={`${favoriteTracks.length} songs`}
                            icon="heart"
                            gradient={[`${colors.accent}4D`, `${colors.accent}1A`]}
                            onPress={handlePlayFavorites}
                            colors={colors}
                        />
                    </View>

                    <View style={styles.section}>
                        <SectionHeader
                            title="Recently Added"
                            action={tracks.length > 0 ? "See All" : undefined}
                            onAction={handleGoToLibrary}
                            colors={colors}
                        />
                        {tracks.length === 0 ? (
                            <EmptyLibraryCard onScan={handleGoToLibrary} colors={colors} />
                        ) : (
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.recentScroll}
                            >
                                {recentTracks.map((track, index) => (
                                    <RecentTrackCard
                                        key={track.id}
                                        track={track}
                                        isActive={currentTrack?.id === track.id}
                                        isPlaying={currentTrack?.id === track.id && isPlaying}
                                        onPress={() => handleTrackPress(index)}
                                        colors={colors}
                                    />
                                ))}
                            </ScrollView>
                        )}
                    </View>


                    <View style={styles.section}>
                        <SectionHeader title="Your Stats" colors={colors} />
                        <GlassCard>
                            <View style={styles.statsGrid}>
                                <View style={styles.statItem}>
                                    <Hero style={[styles.statNumber, { color: colors.primary }]}>{tracks.length}</Hero>
                                    <Caption>Songs</Caption>
                                </View>
                                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                                <View style={styles.statItem}>
                                    <Hero style={[styles.statNumber, { color: colors.primary }]}>{totalHours}</Hero>
                                    <Caption>Hours</Caption>
                                </View>
                                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                                <View style={styles.statItem}>
                                    <Hero style={[styles.statNumber, { color: colors.primary }]}>{uniqueArtists}</Hero>
                                    <Caption>Artists</Caption>
                                </View>
                            </View>
                        </GlassCard>
                    </View>

                    <View style={{ height: 160 }} />
                </ScrollView>
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
        height: 400,
    },
    safeArea: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: Theme.spacing.lg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingTop: Theme.spacing.lg,
        marginBottom: Theme.spacing.xl,
    },
    greetingEmoji: {
        fontSize: 28,
        marginBottom: Theme.spacing.xs,
    },
    greeting: {
        marginBottom: Theme.spacing.xs,
    },
    searchButton: {
        width: 48,
        height: 48,
        borderRadius: Theme.borderRadius.full,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    quickActions: {
        flexDirection: 'row',
        gap: Theme.spacing.md,
        marginBottom: Theme.spacing.xl,
    },
    quickCard: {
        flex: 1,
        borderRadius: Theme.borderRadius.lg,
        overflow: 'hidden',
    },
    quickCardGradient: {
        padding: Theme.spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Theme.spacing.sm,
    },
    quickCardText: {
        flex: 1,
    },
    pressed: {
        opacity: 0.8,
        transform: [{ scale: 0.98 }],
    },
    section: {
        marginBottom: Theme.spacing.xl,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Theme.spacing.md,
    },
    emptyCard: {
        paddingVertical: Theme.spacing.xl,
    },
    emptyContent: {
        alignItems: 'center',
    },
    emptyIconContainer: {
        width: 80,
        height: 80,
        borderRadius: Theme.borderRadius.full,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Theme.spacing.lg,
    },
    emptyTitle: {
        marginBottom: Theme.spacing.sm,
        textAlign: 'center',
    },
    emptyText: {
        textAlign: 'center',
        marginBottom: Theme.spacing.lg,
        paddingHorizontal: Theme.spacing.lg,
    },
    scanButton: {
        borderRadius: Theme.borderRadius.full,
        overflow: 'hidden',
    },
    scanButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Theme.spacing.sm + 4,
        paddingHorizontal: Theme.spacing.lg,
    },
    recentScroll: {
        gap: Theme.spacing.md,
    },
    recentCard: {
        width: 140,
        gap: Theme.spacing.xs,
    },
    recentArtwork: {
        width: 140,
        height: 140,
        borderRadius: Theme.borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statsGrid: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 36,
    },
    statDivider: {
        width: 1,
        height: 40,
    },
});
