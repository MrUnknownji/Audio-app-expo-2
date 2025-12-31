import React from 'react';
import { View, StyleSheet, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Playlist } from '@/services/audio/types';
import { Theme } from '@/constants/theme';
import { Heading, Caption } from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';

interface PlaylistCardProps {
    playlist: Playlist;
    trackCount: number;
    onPress?: () => void;
}

export function PlaylistCard({ playlist, trackCount, onPress }: PlaylistCardProps) {
    const { colors } = useTheme();

    const handlePress = () => {
        if (onPress) {
            onPress();
        } else {
            router.push(`/playlist/${playlist.id}`);
        }
    };

    return (
        <Pressable
            style={({ pressed }) => [
                styles.container,
                {
                    backgroundColor: colors.surfaceGlass,
                    borderColor: colors.border
                },
                pressed && styles.pressed
            ]}
            onPress={handlePress}
        >
            <View style={[styles.artwork, { backgroundColor: colors.primaryMuted }]}>
                {playlist.artwork ? (
                    <Image source={{ uri: playlist.artwork }} style={styles.artworkImage} />
                ) : (
                    <Ionicons name="musical-notes" size={32} color={colors.primary} />
                )}
            </View>
            <View style={styles.info}>
                <Heading numberOfLines={1}>{playlist.name}</Heading>
                <Caption>{trackCount} {trackCount === 1 ? 'song' : 'songs'}</Caption>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Theme.spacing.md,
        gap: Theme.spacing.md,
        borderRadius: Theme.borderRadius.lg,
        borderWidth: 1,
    },
    pressed: {
        opacity: 0.8,
        transform: [{ scale: 0.98 }],
    },
    artwork: {
        width: 56,
        height: 56,
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
        gap: 2,
    },
});
