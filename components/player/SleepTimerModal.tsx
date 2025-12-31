import React from 'react';
import { View, StyleSheet, Pressable, Modal, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Theme } from '@/constants/theme';
import { Heading, Body, Caption } from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';
import { useSleepTimerStore } from '@/stores/sleepTimerStore';

interface SleepTimerModalProps {
    visible: boolean;
    onClose: () => void;
}

const TIMER_PRESETS = [
    { label: '15 min', minutes: 15, icon: 'moon-outline' as const },
    { label: '30 min', minutes: 30, icon: 'moon' as const },
    { label: '45 min', minutes: 45, icon: 'cloudy-night-outline' as const },
    { label: '1 hour', minutes: 60, icon: 'cloudy-night' as const },
    { label: '2 hours', minutes: 120, icon: 'bed-outline' as const },
];

const SHEET_HEIGHT = 400;

export function SleepTimerModal({ visible, onClose }: SleepTimerModalProps) {
    const { colors } = useTheme();
    const { isActive, setTimer, cancelTimer, getRemainingFormatted } = useSleepTimerStore();
    const translateY = useSharedValue(SHEET_HEIGHT);

    React.useEffect(() => {
        if (visible) {
            translateY.value = withTiming(0, { duration: 250 });
        } else {
            translateY.value = withTiming(SHEET_HEIGHT, { duration: 200 });
        }
    }, [visible]);

    const close = () => {
        translateY.value = withTiming(SHEET_HEIGHT, { duration: 200 });
        setTimeout(() => onClose(), 200);
    };

    const handleSetTimer = (minutes: number) => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        setTimer(minutes);
        close();
    };

    const handleCancel = () => {
        if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
        cancelTimer();
    };

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    const panGesture = Gesture.Pan()
        .onUpdate((event) => {
            if (event.translationY > 0) {
                translateY.value = event.translationY;
            }
        })
        .onEnd((event) => {
            if (event.translationY > 100 || event.velocityY > 500) {
                translateY.value = withTiming(SHEET_HEIGHT, { duration: 200 });
                runOnJS(onClose)();
            } else {
                translateY.value = withTiming(0, { duration: 150 });
            }
        });

    if (!visible) return null;

    return (
        <Modal transparent visible={visible} animationType="none" onRequestClose={close}>
            <Pressable style={styles.overlay} onPress={close}>
                <GestureDetector gesture={panGesture}>
                    <Animated.View
                        style={[
                            styles.sheet,
                            { backgroundColor: colors.surface },
                            animatedStyle,
                        ]}
                    >
                        <Pressable onPress={(e) => e.stopPropagation()}>
                            {/* Handle */}
                            <View style={[styles.handle, { backgroundColor: colors.border }]} />

                            {/* Header */}
                            <View style={styles.header}>
                                <View style={[styles.iconCircle, { backgroundColor: colors.surfaceElevated }]}>
                                    <Ionicons name="moon" size={28} color={colors.primary} />
                                </View>
                                <Heading style={styles.title}>Sleep Timer</Heading>
                            </View>

                            {isActive ? (
                                <View style={styles.activeTimer}>
                                    <Caption>Music will stop in</Caption>
                                    <Heading style={[styles.countdown, { color: colors.primary }]}>
                                        {getRemainingFormatted()}
                                    </Heading>
                                    <Pressable
                                        style={[styles.cancelButton, { backgroundColor: colors.error + '20' }]}
                                        onPress={handleCancel}
                                    >
                                        <Body style={{ color: colors.error, fontWeight: '600' }}>
                                            Cancel Timer
                                        </Body>
                                    </Pressable>
                                </View>
                            ) : (
                                <View style={styles.presets}>
                                    {TIMER_PRESETS.map((preset) => (
                                        <Pressable
                                            key={preset.minutes}
                                            style={({ pressed }) => [
                                                styles.presetButton,
                                                { backgroundColor: colors.surfaceElevated },
                                                pressed && { backgroundColor: colors.border },
                                            ]}
                                            onPress={() => handleSetTimer(preset.minutes)}
                                        >
                                            <View style={[styles.presetIcon, { backgroundColor: colors.surfaceElevated }]}>
                                                <Ionicons name={preset.icon} size={20} color={colors.primary} />
                                            </View>
                                            <Body style={{ fontWeight: '500' }}>{preset.label}</Body>
                                        </Pressable>
                                    ))}
                                </View>
                            )}

                            {/* Close button */}
                            <Pressable
                                style={[styles.closeButton, { backgroundColor: colors.surfaceGlass }]}
                                onPress={close}
                            >
                                <Body color={colors.textSecondary} style={{ fontWeight: '600' }}>
                                    Close
                                </Body>
                            </Pressable>
                        </Pressable>
                    </Animated.View>
                </GestureDetector>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    sheet: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: 40,
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Theme.spacing.md,
        paddingHorizontal: Theme.spacing.lg,
        marginBottom: Theme.spacing.lg,
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        flex: 1,
    },
    activeTimer: {
        alignItems: 'center',
        paddingHorizontal: Theme.spacing.lg,
        paddingVertical: Theme.spacing.xl,
    },
    countdown: {
        fontSize: 56,
        fontWeight: '700',
        marginVertical: Theme.spacing.lg,
    },
    cancelButton: {
        paddingVertical: Theme.spacing.md,
        paddingHorizontal: Theme.spacing.xl,
        borderRadius: Theme.borderRadius.full,
    },
    presets: {
        paddingHorizontal: Theme.spacing.lg,
        gap: Theme.spacing.sm,
    },
    presetButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Theme.spacing.md,
        paddingVertical: Theme.spacing.md,
        paddingHorizontal: Theme.spacing.md,
        borderRadius: Theme.borderRadius.md,
    },
    presetIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeButton: {
        marginHorizontal: Theme.spacing.lg,
        marginTop: Theme.spacing.lg,
        padding: Theme.spacing.md,
        borderRadius: Theme.borderRadius.md,
        alignItems: 'center',
    },
});
