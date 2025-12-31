import React from 'react';
import { View, StyleSheet, Pressable, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { usePlayer } from '@/hooks/usePlayer';
import { Theme } from '@/constants/theme';
import { Body, Caption } from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';

export function MiniPlayer() {
    const { colors } = useTheme();
    const {
        currentTrack,
        isPlaying,
        progress,
        pause,
        resume,
        next,
    } = usePlayer();

    if (!currentTrack) return null;

    const handlePlayPause = async () => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }

        if (isPlaying) {
            await pause();
        } else {
            await resume();
        }
    };

    const handlePress = () => {
        router.push('/player');
    };

    return (
        <Pressable
            style={[
                styles.container,
                {
                    backgroundColor: colors.surface,
                    shadowColor: colors.shadowDark,
                }
            ]}
            onPress={handlePress}
        >
            <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: colors.primary }]} />
            </View>

            <View style={styles.content}>
                <View style={[styles.artwork, { backgroundColor: colors.surfaceElevated }]}>
                    {currentTrack.artwork ? (
                        <Image
                            source={{ uri: currentTrack.artwork }}
                            style={styles.artworkImage}
                        />
                    ) : (
                        <Ionicons name="musical-notes" size={20} color={colors.primary} />
                    )}
                </View>

                <View style={styles.info}>
                    <Body numberOfLines={1} style={styles.title}>
                        {currentTrack.title}
                    </Body>
                    <Caption numberOfLines={1}>
                        {currentTrack.artist}
                    </Caption>
                </View>

                <Pressable
                    style={[styles.playButton, { backgroundColor: colors.primary }]}
                    onPress={handlePlayPause}
                >
                    <Ionicons
                        name={isPlaying ? 'pause' : 'play'}
                        size={20}
                        color={colors.text}
                    />
                </Pressable>

                <Pressable style={styles.controlButton} onPress={next}>
                    <Ionicons name="play-skip-forward" size={20} color={colors.textSecondary} />
                </Pressable>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        height: 68,
        marginHorizontal: Theme.spacing.md,
        marginBottom: Theme.spacing.sm,
        borderRadius: Theme.borderRadius.lg,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 8,
        elevation: 8,
    },
    progressBar: {
        height: 3,
        borderTopLeftRadius: Theme.borderRadius.lg,
        borderTopRightRadius: Theme.borderRadius.lg,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
    },
    content: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Theme.spacing.md,
        gap: Theme.spacing.sm,
    },
    artwork: {
        width: 44,
        height: 44,
        borderRadius: Theme.borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    artworkImage: {
        width: '100%',
        height: '100%',
    },
    info: {
        flex: 1,
    },
    title: {
        fontWeight: '600',
    },
    playButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    controlButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
