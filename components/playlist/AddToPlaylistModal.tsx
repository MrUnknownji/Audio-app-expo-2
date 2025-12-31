import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Modal, TextInput, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '@/constants/theme';
import { Heading, Body, Caption } from '@/components/ui';
import { usePlaylistStore } from '@/stores/playlistStore';
import { Playlist } from '@/services/audio/types';
import { useTheme } from '@/hooks/useTheme';

interface AddToPlaylistModalProps {
    visible: boolean;
    trackIds: string[];
    onClose: () => void;
}

export function AddToPlaylistModal({ visible, trackIds, onClose }: AddToPlaylistModalProps) {
    const { colors } = useTheme();
    const { playlists, addTrackToPlaylist, createPlaylist } = usePlaylistStore();
    const [showCreate, setShowCreate] = useState(false);
    const [newPlaylistName, setNewPlaylistName] = useState('');

    const handleAddToPlaylist = (playlistId: string) => {
        trackIds.forEach(id => addTrackToPlaylist(playlistId, id));
        onClose();
    };

    const handleCreateAndAdd = () => {
        if (newPlaylistName.trim()) {
            const playlist = createPlaylist(newPlaylistName.trim());
            trackIds.forEach(id => addTrackToPlaylist(playlist.id, id));
            setNewPlaylistName('');
            setShowCreate(false);
            onClose();
        }
    };

    const renderPlaylist = ({ item }: { item: Playlist }) => {
        const isAdded = trackIds.every(id => item.trackIds.includes(id));

        return (
            <Pressable
                style={[styles.playlistItem, isAdded && styles.playlistItemDisabled]}
                onPress={() => !isAdded && handleAddToPlaylist(item.id)}
                disabled={isAdded}
            >
                <View style={[styles.playlistIcon, { backgroundColor: colors.surfaceElevated }]}>
                    <Ionicons name="musical-notes" size={20} color={colors.primary} />
                </View>
                <View style={styles.playlistInfo}>
                    <Body>{item.name}</Body>
                    <Caption>{item.trackIds.length} songs</Caption>
                </View>
                {isAdded && (
                    <Ionicons name="checkmark-circle" size={22} color={colors.success} />
                )}
            </Pressable>
        );
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <Pressable style={styles.overlay} onPress={onClose}>
                <Pressable style={[styles.content, { backgroundColor: colors.surface }]} onPress={e => e.stopPropagation()}>
                    <View style={[styles.handle, { backgroundColor: colors.border }]} />

                    <View style={styles.header}>
                        <Heading>Add to Playlist</Heading>
                        <Pressable onPress={onClose}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </Pressable>
                    </View>

                    {showCreate ? (
                        <View style={styles.createSection}>
                            <TextInput
                                style={[
                                    styles.input,
                                    {
                                        backgroundColor: colors.surfaceElevated,
                                        color: colors.text
                                    }
                                ]}
                                placeholder="Playlist name"
                                placeholderTextColor={colors.textMuted}
                                value={newPlaylistName}
                                onChangeText={setNewPlaylistName}
                                autoFocus
                            />
                            <View style={styles.createButtons}>
                                <Pressable
                                    style={styles.cancelButton}
                                    onPress={() => setShowCreate(false)}
                                >
                                    <Body color={colors.textSecondary}>Cancel</Body>
                                </Pressable>
                                <Pressable
                                    style={[styles.createButton, { backgroundColor: colors.primary }]}
                                    onPress={handleCreateAndAdd}
                                >
                                    <Body style={{ color: colors.text, fontWeight: '600' }}>Create</Body>
                                </Pressable>
                            </View>
                        </View>
                    ) : (
                        <>
                            <Pressable
                                style={[styles.newPlaylistButton, { borderBottomColor: colors.border }]}
                                onPress={() => setShowCreate(true)}
                            >
                                <View style={[styles.newPlaylistIcon, { backgroundColor: colors.primaryMuted }]}>
                                    <Ionicons name="add" size={24} color={colors.primary} />
                                </View>
                                <Body style={{ color: colors.primary, fontWeight: '600' }}>
                                    New Playlist
                                </Body>
                            </Pressable>

                            {playlists.length > 0 ? (
                                <FlatList
                                    data={playlists}
                                    renderItem={renderPlaylist}
                                    keyExtractor={item => item.id}
                                    style={styles.list}
                                    showsVerticalScrollIndicator={false}
                                />
                            ) : (
                                <View style={styles.empty}>
                                    <Caption>No playlists yet</Caption>
                                </View>
                            )}
                        </>
                    )}
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'flex-end',
    },
    content: {
        borderTopLeftRadius: Theme.borderRadius.xl,
        borderTopRightRadius: Theme.borderRadius.xl,
        maxHeight: '70%',
        paddingBottom: 40,
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: Theme.spacing.sm,
        marginBottom: Theme.spacing.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Theme.spacing.lg,
        marginBottom: Theme.spacing.md,
    },
    newPlaylistButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Theme.spacing.md,
        paddingHorizontal: Theme.spacing.lg,
        paddingVertical: Theme.spacing.md,
        borderBottomWidth: 1,
    },
    newPlaylistIcon: {
        width: 44,
        height: 44,
        borderRadius: Theme.borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    list: {
        paddingHorizontal: Theme.spacing.lg,
    },
    playlistItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Theme.spacing.md,
        paddingVertical: Theme.spacing.md,
    },
    playlistItemDisabled: {
        opacity: 0.5,
    },
    playlistIcon: {
        width: 44,
        height: 44,
        borderRadius: Theme.borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    playlistInfo: {
        flex: 1,
    },
    empty: {
        padding: Theme.spacing.xl,
        alignItems: 'center',
    },
    createSection: {
        padding: Theme.spacing.lg,
    },
    input: {
        borderRadius: Theme.borderRadius.md,
        padding: Theme.spacing.md,
        fontSize: 16,
        marginBottom: Theme.spacing.md,
    },
    createButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: Theme.spacing.md,
    },
    cancelButton: {
        padding: Theme.spacing.md,
    },
    createButton: {
        paddingVertical: Theme.spacing.sm,
        paddingHorizontal: Theme.spacing.lg,
        borderRadius: Theme.borderRadius.md,
    },
});
