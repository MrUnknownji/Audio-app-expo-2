import React, { useEffect } from 'react';
import { View, StyleSheet, Pressable, Dimensions, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
    interpolate,
    Extrapolate,
    runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

import { Theme } from '@/constants/theme';
import { Hero, Title, Body, Caption } from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';
import { usePlayer } from '@/hooks/usePlayer';

const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD = 80;

function formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function AnimatedPressable({
    children,
    onPress,
    style,
    size = 120
}: {
    children: React.ReactNode;
    onPress: () => void;
    style?: any;
    size?: number;
}) {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
        scale.value = withSpring(0.9, { damping: 15, stiffness: 400 });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    };

    const handlePressOut = () => {
        scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    };

    return (
        <Pressable
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={[{ width: size, height: size }, style]}
        >
            <Animated.View style={[{ width: size, height: size }, animatedStyle]}>
                {children}
            </Animated.View>
        </Pressable>
    );
}

export default function DrivingScreen() {
    const { colors } = useTheme();
    const { currentTrack, isPlaying, position, duration, play, pause, next, previous, seekTo } = usePlayer();

    const translateX = useSharedValue(0);
    const swipeOpacity = useSharedValue(0);

    useEffect(() => {
        StatusBar.setHidden(true);
        return () => StatusBar.setHidden(false);
    }, []);

    const handleSwipeComplete = (direction: 'left' | 'right') => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        if (direction === 'left') {
            next();
        } else {
            previous();
        }
    };

    const panGesture = Gesture.Pan()
        .onUpdate((event) => {
            translateX.value = event.translationX;
            swipeOpacity.value = interpolate(
                Math.abs(event.translationX),
                [0, SWIPE_THRESHOLD],
                [0, 1],
                Extrapolate.CLAMP
            );
        })
        .onEnd((event) => {
            if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
                const direction = event.translationX > 0 ? 'right' : 'left';
                runOnJS(handleSwipeComplete)(direction);
            }
            translateX.value = withSpring(0);
            swipeOpacity.value = withTiming(0);
        });

    const containerStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value * 0.3 }],
    }));

    const leftIndicatorStyle = useAnimatedStyle(() => ({
        opacity: translateX.value > 0 ? swipeOpacity.value : 0,
    }));

    const rightIndicatorStyle = useAnimatedStyle(() => ({
        opacity: translateX.value < 0 ? swipeOpacity.value : 0,
    }));

    const handlePlayPause = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        if (isPlaying) {
            pause();
        } else {
            play();
        }
    };

    const handleSeek = (forward: boolean) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const newPosition = position + (forward ? 10000 : -10000);
        seekTo(Math.max(0, Math.min(duration, newPosition)));
    };

    const handleClose = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.back();
    };

    const progress = duration > 0 ? position / duration : 0;

    return (
        <GestureDetector gesture={panGesture}>
            <View style={[styles.container, { backgroundColor: '#0A0A0F' }]}>
                <LinearGradient
                    colors={[`${colors.primary}40`, 'transparent']}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 0.4 }}
                    style={styles.topGradient}
                />

                <Animated.View style={[styles.leftIndicator, leftIndicatorStyle]}>
                    <Ionicons name="play-back" size={48} color={colors.primary} />
                    <Caption style={{ color: colors.primary }}>Previous</Caption>
                </Animated.View>

                <Animated.View style={[styles.rightIndicator, rightIndicatorStyle]}>
                    <Ionicons name="play-forward" size={48} color={colors.primary} />
                    <Caption style={{ color: colors.primary }}>Next</Caption>
                </Animated.View>

                <Animated.View style={[styles.content, containerStyle]}>
                    <Pressable onPress={handleClose} style={styles.closeButton}>
                        <Ionicons name="close" size={32} color={colors.text} />
                    </Pressable>

                    <View style={styles.trackInfo}>
                        <Hero style={styles.trackTitle} numberOfLines={2}>
                            {currentTrack?.title || 'No track'}
                        </Hero>
                        <Title style={[styles.trackArtist, { color: colors.textSecondary }]} numberOfLines={1}>
                            {currentTrack?.artist || 'Unknown Artist'}
                        </Title>
                    </View>

                    <View style={styles.progressContainer}>
                        <View style={[styles.progressTrack, { backgroundColor: `${colors.primary}30` }]}>
                            <LinearGradient
                                colors={[colors.primary, colors.secondary]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={[styles.progressBar, { width: `${progress * 100}%` }]}
                            />
                        </View>
                        <View style={styles.timeRow}>
                            <Body style={{ color: colors.textSecondary }}>{formatTime(position)}</Body>
                            <Body style={{ color: colors.textSecondary }}>{formatTime(duration)}</Body>
                        </View>
                    </View>

                    <View style={styles.controls}>
                        <AnimatedPressable onPress={() => handleSeek(false)} size={80}>
                            <View style={[styles.seekButton, { backgroundColor: `${colors.primary}20` }]}>
                                <Ionicons name="play-back" size={36} color={colors.text} />
                                <Caption style={styles.seekLabel}>10s</Caption>
                            </View>
                        </AnimatedPressable>

                        <AnimatedPressable onPress={handlePlayPause} size={140}>
                            <LinearGradient
                                colors={[colors.primary, colors.secondary]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.playButton}
                            >
                                <Ionicons
                                    name={isPlaying ? 'pause' : 'play'}
                                    size={64}
                                    color="#FFFFFF"
                                    style={!isPlaying && { marginLeft: 8 }}
                                />
                            </LinearGradient>
                        </AnimatedPressable>

                        <AnimatedPressable onPress={() => handleSeek(true)} size={80}>
                            <View style={[styles.seekButton, { backgroundColor: `${colors.primary}20` }]}>
                                <Ionicons name="play-forward" size={36} color={colors.text} />
                                <Caption style={styles.seekLabel}>10s</Caption>
                            </View>
                        </AnimatedPressable>
                    </View>

                    <View style={styles.skipHint}>
                        <Ionicons name="swap-horizontal" size={20} color={colors.textMuted} />
                        <Caption style={{ color: colors.textMuted }}>Swipe left/right to skip</Caption>
                    </View>
                </Animated.View>
            </View>
        </GestureDetector>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    topGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 300,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: Theme.spacing.xl,
    },
    closeButton: {
        position: 'absolute',
        top: 60,
        right: Theme.spacing.lg,
        width: 48,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },
    trackInfo: {
        alignItems: 'center',
        marginBottom: Theme.spacing.xl * 2,
        paddingHorizontal: Theme.spacing.lg,
    },
    trackTitle: {
        fontSize: 32,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: Theme.spacing.sm,
    },
    trackArtist: {
        fontSize: 20,
        textAlign: 'center',
    },
    progressContainer: {
        width: '100%',
        marginBottom: Theme.spacing.xl * 2,
    },
    progressTrack: {
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        borderRadius: 4,
    },
    timeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: Theme.spacing.sm,
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Theme.spacing.xl,
        marginBottom: Theme.spacing.xl * 2,
    },
    playButton: {
        width: 140,
        height: 140,
        borderRadius: 70,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 12,
    },
    seekButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    seekLabel: {
        position: 'absolute',
        bottom: 12,
        fontSize: 10,
    },
    skipHint: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Theme.spacing.xs,
    },
    leftIndicator: {
        position: 'absolute',
        left: Theme.spacing.xl,
        top: '50%',
        marginTop: -40,
        alignItems: 'center',
        gap: Theme.spacing.xs,
    },
    rightIndicator: {
        position: 'absolute',
        right: Theme.spacing.xl,
        top: '50%',
        marginTop: -40,
        alignItems: 'center',
        gap: Theme.spacing.xs,
    },
});
