import React, { useState, useCallback, useRef } from 'react';
import { View, StyleSheet, Pressable, Dimensions, Platform, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    runOnJS,
    interpolate,
    Extrapolate,
} from 'react-native-reanimated';
import { Theme } from '@/constants/theme';
import { ColorTokens } from '@/constants/colors';
import { Title, Body, Caption } from '@/components/ui';
import { SleepTimerModal } from '@/components/player';
import { usePlayer } from '@/hooks/usePlayer';
import { useTheme } from '@/hooks/useTheme';
import { usePlaylistStore } from '@/stores/playlistStore';
import { useSleepTimerStore } from '@/stores/sleepTimerStore';
import { useSettingsStore } from '@/stores/settingsStore';

const { width } = Dimensions.get('window');
const ARTWORK_SIZE = width - Theme.spacing.lg * 4;

function ControlButton({
    icon,
    size = 28,
    onPress,
    primary = false,
    active = false,
    colors,
}: {
    icon: keyof typeof Ionicons.glyphMap;
    size?: number;
    onPress?: () => void;
    primary?: boolean;
    active?: boolean;
    colors: ColorTokens;
}) {
    const handlePress = () => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onPress?.();
    };

    if (primary) {
        return (
            <Pressable
                style={({ pressed }) => [styles.primaryControl, pressed && styles.pressed]}
                onPress={handlePress}
            >
                <LinearGradient
                    colors={[colors.primary, '#A855F7']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.primaryControlGradient}
                >
                    <Ionicons name={icon} size={size} color={colors.text} />
                </LinearGradient>
            </Pressable>
        );
    }

    return (
        <Pressable
            style={({ pressed }) => [styles.controlButton, pressed && styles.pressed]}
            onPress={handlePress}
        >
            <Ionicons name={icon} size={size} color={active ? colors.primary : colors.text} />
        </Pressable>
    );
}

export default function PlayerScreen() {
    const { colors } = useTheme();
    const { toggleFavorite, isFavorite } = usePlaylistStore();
    const { isActive: sleepTimerActive } = useSleepTimerStore();
    const { focusMode, setFocusMode } = useSettingsStore();
    const [showSleepTimer, setShowSleepTimer] = useState(false);
    const [isSeeking, setIsSeeking] = useState(false);
    const seekBarWidth = useRef(width - Theme.spacing.lg * 2);

    // Animated values
    const artworkTranslateX = useSharedValue(0);
    const seekProgress = useSharedValue(0);
    const thumbScale = useSharedValue(1);
    const {
        currentTrack,
        isPlaying,
        position,
        duration,
        progress,
        repeatMode,
        isShuffled,
        playbackRate,
        loopStart,
        loopEnd,
        pause,
        resume,
        seekTo,
        next,
        previous,
        toggleShuffle,
        toggleRepeat,
        cyclePlaybackRate,
        setLoopPoint,
        clearLoop,
        formatTime,
    } = usePlayer();

    const isLoopActive = loopStart !== null && loopEnd !== null;

    const trackIsFavorite = currentTrack ? isFavorite(currentTrack.id) : false;

    const handleToggleFavorite = () => {
        if (currentTrack) {
            if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            toggleFavorite(currentTrack.id);
        }
    };

    const handlePlayPause = async () => {
        if (isPlaying) {
            await pause();
        } else {
            await resume();
        }
    };

    const handleSeek = (percentage: number) => {
        const newPosition = (percentage / 100) * duration;
        seekTo(newPosition);
    };

    const getRepeatIcon = (): keyof typeof Ionicons.glyphMap => {
        if (repeatMode === 'one') return 'repeat';
        return 'repeat';
    };

    // Animated swipe gesture for track navigation
    const SWIPE_THRESHOLD = 80;

    const swipeGesture = Gesture.Pan()
        .onUpdate((event) => {
            artworkTranslateX.value = event.translationX * 0.5; // Dampened drag
        })
        .onEnd((event) => {
            if (event.translationX < -SWIPE_THRESHOLD) {
                // Swiped left - next track
                artworkTranslateX.value = withTiming(-300, { duration: 150 }, () => {
                    runOnJS(next)();
                    artworkTranslateX.value = 300;
                    artworkTranslateX.value = withSpring(0, { damping: 20, stiffness: 200 });
                });
                if (Platform.OS !== 'web') {
                    runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
                }
            } else if (event.translationX > SWIPE_THRESHOLD) {
                // Swiped right - previous track
                artworkTranslateX.value = withTiming(300, { duration: 150 }, () => {
                    runOnJS(previous)();
                    artworkTranslateX.value = -300;
                    artworkTranslateX.value = withSpring(0, { damping: 20, stiffness: 200 });
                });
                if (Platform.OS !== 'web') {
                    runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
                }
            } else {
                // Snap back
                artworkTranslateX.value = withSpring(0, { damping: 20, stiffness: 200 });
            }
        })
        .runOnJS(true);

    const artworkAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: artworkTranslateX.value }],
    }));

    // Handle tap to seek
    const handleTapSeek = (locationX: number) => {
        const percentage = (locationX / seekBarWidth.current) * 100;
        handleSeek(Math.max(0, Math.min(100, percentage)));
    };

    // Seekbar gesture
    const seekGesture = Gesture.Pan()
        .onBegin(() => {
            thumbScale.value = withTiming(1.3, { duration: 100 });
            runOnJS(setIsSeeking)(true);
        })
        .onUpdate((event) => {
            const clampedX = Math.max(0, Math.min(seekBarWidth.current, event.x));
            seekProgress.value = (clampedX / seekBarWidth.current) * 100;
        })
        .onEnd(() => {
            thumbScale.value = withTiming(1, { duration: 100 });
            runOnJS(setIsSeeking)(false);
            runOnJS(handleSeek)(seekProgress.value);
        })
        .runOnJS(true);

    const seekThumbAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: thumbScale.value }],
    }));

    // Animated seekbar fill and position
    const seekFillAnimatedStyle = useAnimatedStyle(() => {
        return {
            width: `${seekProgress.value}%`,
        };
    });

    const seekThumbPositionStyle = useAnimatedStyle(() => {
        return {
            left: `${seekProgress.value}%`,
        };
    });

    // Sync seekProgress with player progress when not seeking
    React.useEffect(() => {
        if (!isSeeking) {
            seekProgress.value = progress;
        }
    }, [progress, isSeeking]);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <LinearGradient
                colors={[
                    `${colors.primary}20`,
                    `${colors.primary}08`,
                    colors.background,
                ]}
                locations={[0, 0.4, 1]}
                style={styles.backgroundGradient}
            />

            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <Pressable
                        style={styles.headerButton}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="chevron-down" size={28} color={colors.text} />
                    </Pressable>

                    <View style={styles.headerCenter}>
                        <Caption>PLAYING FROM</Caption>
                        <Body style={{ fontWeight: '600' }}>Your Library</Body>
                    </View>

                    <Pressable
                        style={styles.headerButton}
                        onPress={() => {
                            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setFocusMode(!focusMode);
                        }}
                    >
                        <Ionicons
                            name={focusMode ? "contract" : "expand"}
                            size={24}
                            color={focusMode ? colors.primary : colors.text}
                        />
                    </Pressable>
                </View>

                <GestureDetector gesture={swipeGesture}>
                    <Animated.View style={[styles.artwork, artworkAnimatedStyle]}>
                        <View style={[styles.artworkPlaceholder, { backgroundColor: colors.surfaceElevated }]}>
                            {currentTrack?.artwork ? (
                                <Image
                                    source={{ uri: currentTrack.artwork }}
                                    style={{ width: '100%', height: '100%', borderRadius: Theme.borderRadius.lg }}
                                />
                            ) : (
                                <>
                                    <Ionicons
                                        name={currentTrack ? 'musical-notes' : 'musical-notes'}
                                        size={80}
                                        color={currentTrack ? colors.primary : colors.textMuted}
                                    />
                                    {!currentTrack && (
                                        <Body color={colors.textMuted} style={{ marginTop: Theme.spacing.md }}>
                                            No song playing
                                        </Body>
                                    )}
                                </>
                            )}
                        </View>
                    </Animated.View>
                </GestureDetector>

                <View style={styles.info}>
                    <View style={styles.titleRow}>
                        <View style={styles.titleText}>
                            <Title numberOfLines={1}>
                                {currentTrack?.title || 'Song Title'}
                            </Title>
                            <Body color={colors.textSecondary} numberOfLines={1}>
                                {currentTrack?.artist || 'Artist Name'}
                            </Body>
                        </View>
                        <Pressable
                            style={styles.favoriteButton}
                            onPress={handleToggleFavorite}
                        >
                            <Ionicons
                                name={trackIsFavorite ? 'heart' : 'heart-outline'}
                                size={28}
                                color={trackIsFavorite ? colors.accent : colors.text}
                            />
                        </Pressable>
                    </View>
                </View>

                <View style={styles.progress}>
                    {!focusMode && (
                        <View style={styles.loopControls}>
                            <Pressable
                                style={[styles.loopButton, loopStart !== null && { backgroundColor: colors.primary + '30' }]}
                                onPress={() => {
                                    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    setLoopPoint('A');
                                }}
                            >
                                <Caption color={loopStart !== null ? colors.primary : colors.textMuted}>A</Caption>
                            </Pressable>
                            {isLoopActive && (
                                <Pressable onPress={clearLoop}>
                                    <Ionicons name="close-circle" size={16} color={colors.primary} />
                                </Pressable>
                            )}
                            <Pressable
                                style={[styles.loopButton, loopEnd !== null && { backgroundColor: colors.primary + '30' }]}
                                onPress={() => {
                                    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    setLoopPoint('B');
                                }}
                            >
                                <Caption color={loopEnd !== null ? colors.primary : colors.textMuted}>B</Caption>
                            </Pressable>
                        </View>
                    )}
                    <GestureDetector gesture={seekGesture}>
                        <Pressable
                            style={styles.progressBarContainer}
                            onPress={(e) => handleTapSeek(e.nativeEvent.locationX)}
                        >
                            <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                                {/* Loop region indicator */}
                                {isLoopActive && duration > 0 && (
                                    <View
                                        style={[
                                            styles.loopRegion,
                                            {
                                                left: `${(loopStart / duration) * 100}%`,
                                                width: `${((loopEnd - loopStart) / duration) * 100}%`,
                                                backgroundColor: colors.primary + '40'
                                            }
                                        ]}
                                    />
                                )}
                                <Animated.View style={[styles.progressFill, { backgroundColor: colors.primary }, seekFillAnimatedStyle]} />
                            </View>
                            <Animated.View style={[
                                styles.progressThumb,
                                { backgroundColor: colors.primary },
                                seekThumbPositionStyle,
                                seekThumbAnimatedStyle
                            ]} />
                        </Pressable>
                    </GestureDetector>
                    <View style={styles.progressTime}>
                        <Caption>{formatTime(position)}</Caption>
                        <Caption>{formatTime(duration)}</Caption>
                    </View>
                </View>

                <View style={styles.controls}>
                    {!focusMode && (
                        <ControlButton
                            icon="shuffle"
                            size={24}
                            active={isShuffled}
                            onPress={toggleShuffle}
                            colors={colors}
                        />
                    )}
                    <ControlButton
                        icon="play-skip-back"
                        size={32}
                        onPress={previous}
                        colors={colors}
                    />

                    <ControlButton
                        icon={isPlaying ? 'pause' : 'play'}
                        size={36}
                        primary
                        onPress={handlePlayPause}
                        colors={colors}
                    />
                    <ControlButton
                        icon="play-skip-forward"
                        size={32}
                        onPress={next}
                        colors={colors}
                    />
                    {!focusMode && (
                        <ControlButton
                            icon={getRepeatIcon()}
                            size={24}
                            active={repeatMode !== 'off'}
                            onPress={toggleRepeat}
                            colors={colors}
                        />
                    )}
                </View>

                {repeatMode === 'one' && (
                    <Caption style={styles.repeatLabel} color={colors.primary}>
                        Repeat One
                    </Caption>
                )}

                {!focusMode && (
                    <View style={styles.bottomActions}>
                        <Pressable
                            style={styles.actionButton}
                            onPress={() => {
                                if (Platform.OS !== 'web') {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                }
                                cyclePlaybackRate();
                            }}
                        >
                            <Body style={{ color: playbackRate !== 1.0 ? colors.primary : colors.textMuted, fontSize: 12, fontWeight: '600' }}>
                                {playbackRate}x
                            </Body>
                        </Pressable>
                        <Pressable
                            style={styles.actionButton}
                            onPress={() => router.push('/equalizer')}
                        >
                            <Ionicons name="cellular" size={20} color={colors.textMuted} />
                        </Pressable>
                        <Pressable
                            style={styles.actionButton}
                            onPress={() => setShowSleepTimer(true)}
                        >
                            <Ionicons
                                name="moon"
                                size={20}
                                color={sleepTimerActive ? colors.primary : colors.textMuted}
                            />
                        </Pressable>
                        <Pressable style={styles.actionButton} onPress={() => router.push('/queue')}>
                            <Ionicons name="list" size={22} color={colors.textMuted} />
                        </Pressable>
                    </View>
                )}

                <SleepTimerModal
                    visible={showSleepTimer}
                    onClose={() => setShowSleepTimer(false)}
                />
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
        height: '60%',
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
    },
    headerButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerCenter: {
        alignItems: 'center',
    },
    artwork: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Theme.spacing.lg,
    },
    artworkPlaceholder: {
        width: ARTWORK_SIZE,
        height: ARTWORK_SIZE,
        borderRadius: Theme.borderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        ...Theme.shadows.lg,
    },
    info: {
        paddingHorizontal: Theme.spacing.lg,
        marginBottom: Theme.spacing.lg,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Theme.spacing.md,
    },
    titleText: {
        flex: 1,
    },
    favoriteButton: {
        padding: Theme.spacing.sm,
    },
    progress: {
        paddingHorizontal: Theme.spacing.lg,
        marginBottom: Theme.spacing.lg,
    },
    progressBar: {
        height: 4,
        borderRadius: 2,
        justifyContent: 'center',
    },
    progressBarContainer: {
        height: 24,
        justifyContent: 'center',
    },
    progressFill: {
        position: 'absolute',
        left: 0,
        height: 4,
        borderRadius: 2,
    },
    progressThumb: {
        position: 'absolute',
        width: 14,
        height: 14,
        borderRadius: 7,
        marginLeft: -7,
        ...Theme.shadows.sm,
    },
    progressTime: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: Theme.spacing.sm,
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Theme.spacing.lg,
        marginBottom: Theme.spacing.md,
    },
    controlButton: {
        padding: Theme.spacing.sm,
    },
    primaryControl: {
        borderRadius: Theme.borderRadius.full,
        overflow: 'hidden',
    },
    primaryControlGradient: {
        width: 72,
        height: 72,
        borderRadius: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pressed: {
        opacity: 0.7,
        transform: [{ scale: 0.95 }],
    },
    repeatLabel: {
        textAlign: 'center',
        marginBottom: Theme.spacing.md,
    },
    bottomActions: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: Theme.spacing.xl,
        paddingBottom: Theme.spacing.lg,
    },
    actionButton: {
        padding: Theme.spacing.sm,
    },
    loopControls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: Theme.spacing.xs,
        marginBottom: Theme.spacing.xs,
    },
    loopButton: {
        paddingHorizontal: Theme.spacing.sm,
        paddingVertical: 2,
        borderRadius: Theme.borderRadius.sm,
    },
    loopRegion: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        borderRadius: 3,
    },
});
