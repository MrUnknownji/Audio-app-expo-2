import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Theme } from '@/constants/theme';
import { Hero, Title, Heading, Body, Caption, GlassCard } from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';
import { useStatsStore } from '@/stores/statsStore';
import { useLibraryStore } from '@/stores/libraryStore';

const { width } = Dimensions.get('window');

function formatDuration(ms: number): string {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
}

function formatDurationShort(ms: number): string {
    const hours = Math.floor(ms / 3600000);
    if (hours > 0) {
        return `${hours}h`;
    }
    return `${Math.floor(ms / 60000)}m`;
}

function StatCard({
    icon,
    value,
    label,
    gradient,
    colors
}: {
    icon: keyof typeof Ionicons.glyphMap;
    value: string;
    label: string;
    gradient: [string, string];
    colors: any;
}) {
    return (
        <LinearGradient
            colors={gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statCard}
        >
            <Ionicons name={icon} size={24} color={colors.text} />
            <Hero style={styles.statValue}>{value}</Hero>
            <Caption>{label}</Caption>
        </LinearGradient>
    );
}

function BarChart({
    data,
    colors
}: {
    data: { day: string; time: number }[];
    colors: any;
}) {
    const maxTime = Math.max(...data.map(d => d.time), 1);

    return (
        <View style={styles.barChart}>
            {data.map((item, index) => {
                const height = Math.max((item.time / maxTime) * 100, 4);
                const isToday = index === data.length - 1;

                return (
                    <View key={item.day} style={styles.barContainer}>
                        <View style={styles.barWrapper}>
                            <LinearGradient
                                colors={isToday ? [colors.primary, colors.secondary] : [`${colors.primary}80`, `${colors.primary}40`]}
                                start={{ x: 0, y: 1 }}
                                end={{ x: 0, y: 0 }}
                                style={[styles.bar, { height: `${height}%` }]}
                            />
                        </View>
                        <Caption style={[styles.barLabel, isToday && { color: colors.primary }]}>
                            {item.day}
                        </Caption>
                    </View>
                );
            })}
        </View>
    );
}

function HourlyHeatmap({
    distribution,
    colors
}: {
    distribution: number[];
    colors: any;
}) {
    const maxValue = Math.max(...distribution, 1);
    const hours = ['12a', '3a', '6a', '9a', '12p', '3p', '6p', '9p'];

    return (
        <View style={styles.heatmapContainer}>
            <View style={styles.heatmapRow}>
                {distribution.slice(0, 12).map((value, index) => {
                    const opacity = value / maxValue;
                    return (
                        <View
                            key={index}
                            style={[
                                styles.heatmapCell,
                                { backgroundColor: `rgba(99, 102, 241, ${Math.max(opacity, 0.1)})` }
                            ]}
                        />
                    );
                })}
            </View>
            <View style={styles.heatmapRow}>
                {distribution.slice(12).map((value, index) => {
                    const opacity = value / maxValue;
                    return (
                        <View
                            key={index + 12}
                            style={[
                                styles.heatmapCell,
                                { backgroundColor: `rgba(99, 102, 241, ${Math.max(opacity, 0.1)})` }
                            ]}
                        />
                    );
                })}
            </View>
            <View style={styles.heatmapLabels}>
                {hours.map((hour) => (
                    <Caption key={hour} style={styles.heatmapLabel}>{hour}</Caption>
                ))}
            </View>
        </View>
    );
}

export default function StatsScreen() {
    const { colors } = useTheme();
    const { tracks } = useLibraryStore();
    const {
        totalListeningTime,
        hourlyDistribution,
        getTopTracks,
        getTopArtists,
        getTodayListeningTime,
        getWeeklyData,
        getStreak,
    } = useStatsStore();

    const todayTime = getTodayListeningTime();
    const weeklyData = getWeeklyData();
    const streak = getStreak();
    const topTracks = useMemo(() => getTopTracks(tracks, 5), [tracks, getTopTracks]);
    const topArtists = useMemo(() => getTopArtists(tracks, 5), [tracks, getTopArtists]);

    const totalPlays = useMemo(() =>
        topTracks.reduce((acc, t) => acc + t.plays, 0),
        [topTracks]
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <LinearGradient
                colors={[`${colors.primary}26`, `${colors.secondary}14`, 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.backgroundGradient}
            />

            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <View style={styles.header}>
                    <Pressable onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={28} color={colors.text} />
                    </Pressable>
                    <Title>Your Stats</Title>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.statsRow}>
                        <StatCard
                            icon="time"
                            value={formatDuration(todayTime)}
                            label="Today"
                            gradient={[`${colors.primary}4D`, `${colors.primary}1A`]}
                            colors={colors}
                        />
                        <StatCard
                            icon="flame"
                            value={`${streak}`}
                            label="Day Streak"
                            gradient={[`${colors.accent}4D`, `${colors.accent}1A`]}
                            colors={colors}
                        />
                    </View>

                    <View style={styles.statsRow}>
                        <StatCard
                            icon="musical-notes"
                            value={`${totalPlays}`}
                            label="Total Plays"
                            gradient={[`${colors.secondary}4D`, `${colors.secondary}1A`]}
                            colors={colors}
                        />
                        <StatCard
                            icon="headset"
                            value={formatDurationShort(totalListeningTime)}
                            label="All Time"
                            gradient={[`${colors.success}4D`, `${colors.success}1A`]}
                            colors={colors}
                        />
                    </View>

                    <GlassCard style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="bar-chart" size={20} color={colors.primary} />
                            <Heading style={styles.sectionTitle}>This Week</Heading>
                        </View>
                        <BarChart data={weeklyData} colors={colors} />
                    </GlassCard>

                    <GlassCard style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="grid" size={20} color={colors.secondary} />
                            <Heading style={styles.sectionTitle}>Listening Pattern</Heading>
                        </View>
                        <Caption style={styles.heatmapSubtitle}>When you listen most</Caption>
                        <HourlyHeatmap distribution={hourlyDistribution} colors={colors} />
                    </GlassCard>

                    {topTracks.length > 0 && (
                        <GlassCard style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="trophy" size={20} color={colors.accent} />
                                <Heading style={styles.sectionTitle}>Top Tracks</Heading>
                            </View>
                            {topTracks.map((item, index) => (
                                <View key={item.track.id} style={styles.listItem}>
                                    <View style={[styles.rankBadge, { backgroundColor: colors.primaryMuted }]}>
                                        <Body style={{ color: colors.primary, fontWeight: '700' }}>
                                            {index + 1}
                                        </Body>
                                    </View>
                                    <View style={styles.trackInfo}>
                                        <Body numberOfLines={1}>{item.track.title}</Body>
                                        <Caption numberOfLines={1}>{item.track.artist}</Caption>
                                    </View>
                                    <Caption>{item.plays} plays</Caption>
                                </View>
                            ))}
                        </GlassCard>
                    )}

                    {topArtists.length > 0 && (
                        <GlassCard style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="person" size={20} color={colors.primary} />
                                <Heading style={styles.sectionTitle}>Top Artists</Heading>
                            </View>
                            {topArtists.map((item, index) => (
                                <View key={item.artist} style={styles.listItem}>
                                    <View style={[styles.rankBadge, { backgroundColor: `${colors.secondary}33` }]}>
                                        <Body style={{ color: colors.secondary, fontWeight: '700' }}>
                                            {index + 1}
                                        </Body>
                                    </View>
                                    <View style={styles.trackInfo}>
                                        <Body numberOfLines={1}>{item.artist}</Body>
                                        <Caption>{formatDuration(item.time)} listened</Caption>
                                    </View>
                                    <Caption>{item.plays} plays</Caption>
                                </View>
                            ))}
                        </GlassCard>
                    )}

                    <View style={{ height: 100 }} />
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Theme.spacing.md,
        paddingVertical: Theme.spacing.sm,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: Theme.spacing.lg,
    },
    statsRow: {
        flexDirection: 'row',
        gap: Theme.spacing.md,
        marginBottom: Theme.spacing.md,
    },
    statCard: {
        flex: 1,
        borderRadius: Theme.borderRadius.lg,
        padding: Theme.spacing.md,
        alignItems: 'center',
        gap: Theme.spacing.xs,
    },
    statValue: {
        fontSize: 28,
        fontWeight: '800',
    },
    section: {
        marginBottom: Theme.spacing.lg,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Theme.spacing.sm,
        marginBottom: Theme.spacing.md,
    },
    sectionTitle: {
        flex: 1,
    },
    barChart: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        height: 120,
        gap: Theme.spacing.xs,
    },
    barContainer: {
        flex: 1,
        alignItems: 'center',
    },
    barWrapper: {
        flex: 1,
        width: '100%',
        justifyContent: 'flex-end',
        marginBottom: Theme.spacing.xs,
    },
    bar: {
        width: '100%',
        borderRadius: Theme.borderRadius.sm,
        minHeight: 4,
    },
    barLabel: {
        fontSize: 10,
    },
    heatmapContainer: {
        gap: Theme.spacing.xs,
    },
    heatmapRow: {
        flexDirection: 'row',
        gap: 4,
    },
    heatmapCell: {
        flex: 1,
        height: 24,
        borderRadius: 4,
    },
    heatmapLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: Theme.spacing.xs,
    },
    heatmapLabel: {
        fontSize: 9,
    },
    heatmapSubtitle: {
        marginBottom: Theme.spacing.sm,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Theme.spacing.md,
        paddingVertical: Theme.spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    rankBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    trackInfo: {
        flex: 1,
    },
});
