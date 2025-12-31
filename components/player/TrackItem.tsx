import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Track } from '@/services/audio/types';
import { Theme } from '@/constants/theme';
import { Body, Caption } from '@/components/ui';
import { AddToPlaylistModal } from '@/components/playlist';
import { TrackOptionsSheet } from './TrackOptionsSheet';
import { useTheme } from '@/hooks/useTheme';
import { usePlaylistStore } from '@/stores/playlistStore';

interface TrackItemProps {
    track: Track;
    isPlaying?: boolean;
    isActive?: boolean;
    onPress: () => void;
    onLongPress?: () => void;
    showOptions?: boolean;
    isSelectionMode?: boolean;
    isSelected?: boolean;
}

function formatDuration(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export const TrackItem = React.memo(function TrackItem({
    track,
    isPlaying,
    isActive,
    onPress,
    onLongPress,
    showOptions = true,
    isSelectionMode,
    isSelected,
}: TrackItemProps) {
    const { colors } = useTheme();
    const { isFavorite } = usePlaylistStore();
    const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);
    const [showOptionsSheet, setShowOptionsSheet] = useState(false);

    const trackIsFavorite = isFavorite(track.id);

    const handleOptionsPress = () => {
        setShowOptionsSheet(true);
    };

    return (
        <>
            <Pressable
                style={({ pressed }) => [
                    styles.container,
                    isActive && !isSelectionMode && { backgroundColor: colors.surfaceElevated },
                    isSelected && { backgroundColor: colors.surfaceElevated },
                    pressed && { backgroundColor: colors.surfaceElevated },
                ]}
                onPress={onPress}
                onLongPress={onLongPress}
                delayLongPress={300}
            >
                <View style={[
                    styles.artwork,
                    { backgroundColor: colors.surfaceElevated },
                    isActive && !isSelectionMode && { borderWidth: 2, borderColor: colors.primary }
                ]}>
                    {isSelectionMode ? (
                        <View style={[
                            styles.selectionCircle,
                            { borderColor: colors.textMuted },
                            isSelected && { backgroundColor: colors.primary, borderColor: colors.primary }
                        ]}>
                            {isSelected && <Ionicons name="checkmark" size={16} color={colors.text} />}
                        </View>
                    ) : (
                        track.artwork ? (
                            <Image
                                source={{ uri: track.artwork }}
                                style={styles.artworkImage}
                            />
                        ) : isPlaying ? (
                            <Ionicons name="musical-notes" size={20} color={colors.primary} />
                        ) : (
                            <Ionicons name="musical-note" size={20} color={colors.textMuted} />
                        )
                    )}
                </View>

                <View style={styles.info}>
                    <Body
                        numberOfLines={1}
                        style={isActive ? { color: colors.primary } : undefined}
                    >
                        {track.title}
                    </Body>
                    <Caption numberOfLines={1}>
                        {track.artist}
                    </Caption>
                </View>

                <Caption style={styles.duration}>
                    {formatDuration(track.duration)}
                </Caption>

                {showOptions && (
                    <Pressable style={styles.optionsButton} onPress={handleOptionsPress}>
                        <Ionicons name="ellipsis-vertical" size={18} color={colors.textMuted} />
                    </Pressable>
                )}
            </Pressable>

            <TrackOptionsSheet
                open={showOptionsSheet}
                onOpenChange={setShowOptionsSheet}
                track={track}
                onAddToPlaylist={() => setShowAddToPlaylist(true)}
            />

            <AddToPlaylistModal
                visible={showAddToPlaylist}
                trackIds={[track.id]}
                onClose={() => setShowAddToPlaylist(false)}
            />
        </>
    );
});

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Theme.spacing.sm,
        paddingHorizontal: Theme.spacing.md,
        gap: Theme.spacing.md,
        borderRadius: Theme.borderRadius.md,
    },
    artwork: {
        width: 48,
        height: 48,
        borderRadius: Theme.borderRadius.sm,
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
    duration: {
        marginRight: Theme.spacing.xs,
    },
    optionsButton: {
        padding: Theme.spacing.sm,
    },
    selectionCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
