import React from 'react';
import { View, StyleSheet, Pressable, Modal, Image, Platform } from 'react-native';
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
import { Track } from '@/services/audio/types';
import { useTheme } from '@/hooks/useTheme';
import { usePlaylistStore } from '@/stores/playlistStore';
import { Theme } from '@/constants/theme';
import { Body, Caption, Heading } from '@/components/ui';

interface TrackOptionsSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    track: Track;
    onAddToPlaylist: () => void;
}

const SHEET_HEIGHT = 320;

export function TrackOptionsSheet({
    open,
    onOpenChange,
    track,
    onAddToPlaylist,
}: TrackOptionsSheetProps) {
    const { colors } = useTheme();
    const { toggleFavorite, isFavorite } = usePlaylistStore();
    const translateY = useSharedValue(SHEET_HEIGHT);

    const trackIsFavorite = isFavorite(track.id);

    React.useEffect(() => {
        if (open) {
            translateY.value = withTiming(0, { duration: 250 });
        } else {
            translateY.value = withTiming(SHEET_HEIGHT, { duration: 200 });
        }
    }, [open]);

    const close = () => {
        translateY.value = withTiming(SHEET_HEIGHT, { duration: 200 });
        setTimeout(() => onOpenChange(false), 200);
    };

    const handleFavorite = () => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        toggleFavorite(track.id);
        close();
    };

    const handleAddToPlaylist = () => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        close();
        setTimeout(() => onAddToPlaylist(), 250);
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
                runOnJS(onOpenChange)(false);
            } else {
                translateY.value = withTiming(0, { duration: 150 });
            }
        });

    if (!open) return null;

    return (
        <Modal transparent visible={open} animationType="none" onRequestClose={close}>
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

                            {/* Track Header */}
                            <View style={styles.header}>
                                <View style={[styles.artwork, { backgroundColor: colors.surfaceElevated }]}>
                                    {track.artwork ? (
                                        <Image source={{ uri: track.artwork }} style={styles.artworkImage} />
                                    ) : (
                                        <Ionicons name="musical-notes" size={28} color={colors.primary} />
                                    )}
                                </View>
                                <View style={styles.trackInfo}>
                                    <Body numberOfLines={1} style={{ fontWeight: '600' }}>
                                        {track.title}
                                    </Body>
                                    <Caption numberOfLines={1}>{track.artist}</Caption>
                                </View>
                            </View>

                            <View style={[styles.divider, { backgroundColor: colors.border }]} />

                            {/* Actions */}
                            <Pressable
                                style={({ pressed }) => [
                                    styles.actionItem,
                                    pressed && { backgroundColor: colors.surfaceElevated },
                                ]}
                                onPress={handleFavorite}
                            >
                                <View style={[styles.iconContainer, { backgroundColor: colors.surfaceElevated }]}>
                                    <Ionicons
                                        name={trackIsFavorite ? 'heart' : 'heart-outline'}
                                        size={20}
                                        color={trackIsFavorite ? colors.accent : colors.primary}
                                    />
                                </View>
                                <Body>{trackIsFavorite ? 'Remove from Favorites' : 'Add to Favorites'}</Body>
                            </Pressable>

                            <Pressable
                                style={({ pressed }) => [
                                    styles.actionItem,
                                    pressed && { backgroundColor: colors.surfaceElevated },
                                ]}
                                onPress={handleAddToPlaylist}
                            >
                                <View style={[styles.iconContainer, { backgroundColor: colors.surfaceElevated }]}>
                                    <Ionicons name="list" size={20} color={colors.primary} />
                                </View>
                                <Body>Add to Playlist</Body>
                            </Pressable>

                            {/* Cancel */}
                            <Pressable
                                style={[styles.cancelButton, { backgroundColor: colors.surfaceElevated }]}
                                onPress={close}
                            >
                                <Body color={colors.textSecondary} style={{ fontWeight: '600' }}>
                                    Cancel
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
        marginBottom: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Theme.spacing.lg,
        paddingBottom: Theme.spacing.md,
        gap: Theme.spacing.md,
    },
    artwork: {
        width: 56,
        height: 56,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    artworkImage: {
        width: '100%',
        height: '100%',
    },
    trackInfo: {
        flex: 1,
    },
    divider: {
        height: 1,
        marginHorizontal: Theme.spacing.lg,
        marginBottom: Theme.spacing.sm,
    },
    actionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Theme.spacing.md,
        paddingHorizontal: Theme.spacing.lg,
        gap: Theme.spacing.md,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        marginHorizontal: Theme.spacing.lg,
        marginTop: Theme.spacing.md,
        padding: Theme.spacing.md,
        borderRadius: Theme.borderRadius.md,
        alignItems: 'center',
    },
});
