import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Pressable, TextInput, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '@/constants/theme';
import { Title, Heading, Body, Caption, GlassCard, useToast } from '@/components/ui';
import { PlaylistCard } from '@/components/playlist';
import { usePlaylistStore } from '@/stores/playlistStore';
import { useLibraryStore } from '@/stores/libraryStore';
import { useTheme } from '@/hooks/useTheme';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

export default function PlaylistsScreen() {
    const { colors } = useTheme();
    const { playlists, favorites, createPlaylist, deletePlaylist, importPlaylist } = usePlaylistStore();
    const { tracks } = useLibraryStore();
    const { showToast } = useToast();
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState('');

    const favoriteTracks = useMemo(() => {
        return tracks.filter(t => favorites.includes(t.id));
    }, [tracks, favorites]);

    const handleCreate = () => {
        if (newName.trim()) {
            createPlaylist(newName.trim());
            setNewName('');
            setShowCreate(false);
        }
    };

    const handleImport = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/json',
                copyToCacheDirectory: true,
            });

            if (result.canceled) return;

            const fileContent = await FileSystem.readAsStringAsync(result.assets[0].uri);
            const imported = importPlaylist(fileContent);

            if (imported) {
                showToast(`Imported "${imported.name}"`, 'success');
            } else {
                showToast('Invalid playlist file', 'error');
            }
        } catch (error) {
            showToast('Failed to import playlist', 'error');
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>

            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <View style={styles.header}>
                    <Title>Playlists</Title>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <Pressable
                            style={[styles.addButton, { backgroundColor: colors.surfaceElevated }]}
                            onPress={handleImport}
                        >
                            <Ionicons name="download-outline" size={24} color={colors.text} />
                        </Pressable>
                        <Pressable
                            style={[styles.addButton, { backgroundColor: colors.primary }]}
                            onPress={() => setShowCreate(true)}
                        >
                            <Ionicons name="add" size={24} color={colors.text} />
                        </Pressable>
                    </View>
                </View>

                <ScrollView
                    style={styles.content}
                    contentContainerStyle={styles.contentContainer}
                    showsVerticalScrollIndicator={false}
                >
                    <GlassCard style={styles.favoritesCard} gradient>
                        <Pressable style={styles.favoritesContent}>
                            <View style={[styles.favoritesIcon, { backgroundColor: `${colors.accent}33` }]}>
                                <Ionicons name="heart" size={28} color={colors.accent} />
                            </View>
                            <View style={styles.favoritesInfo}>
                                <Heading>Favorites</Heading>
                                <Caption>{favoriteTracks.length} songs</Caption>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                        </Pressable>
                    </GlassCard>

                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Heading>Your Playlists</Heading>
                            <Caption>{playlists.length} playlists</Caption>
                        </View>

                        {playlists.length === 0 ? (
                            <GlassCard style={styles.emptyCard}>
                                <View style={styles.emptyContent}>
                                    <Ionicons name="musical-notes" size={48} color={colors.textMuted} />
                                    <Body color={colors.textSecondary} style={styles.emptyText}>
                                        Create your first playlist
                                    </Body>
                                    <Pressable
                                        style={[styles.createButton, { backgroundColor: colors.primary }]}
                                        onPress={() => setShowCreate(true)}
                                    >
                                        <Ionicons name="add" size={20} color={colors.text} />
                                        <Body style={{ color: colors.text, fontWeight: '600' }}>
                                            New Playlist
                                        </Body>
                                    </Pressable>
                                </View>
                            </GlassCard>
                        ) : (
                            <View style={styles.playlistList}>
                                {playlists.map(playlist => (
                                    <PlaylistCard
                                        key={playlist.id}
                                        playlist={playlist}
                                        trackCount={playlist.trackIds.length}
                                    />
                                ))}
                            </View>
                        )}
                    </View>

                    <View style={{ height: 140 }} />
                </ScrollView>
            </SafeAreaView>

            <Modal
                visible={showCreate}
                transparent
                animationType="fade"
                onRequestClose={() => setShowCreate(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setShowCreate(false)}
                >
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <Heading style={styles.modalTitle}>New Playlist</Heading>
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
                            value={newName}
                            onChangeText={setNewName}
                            autoFocus
                        />
                        <View style={styles.modalButtons}>
                            <Pressable
                                style={styles.cancelBtn}
                                onPress={() => setShowCreate(false)}
                            >
                                <Body color={colors.textSecondary}>Cancel</Body>
                            </Pressable>
                            <Pressable
                                style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
                                onPress={handleCreate}
                            >
                                <Body style={{ color: colors.text, fontWeight: '600' }}>Create</Body>
                            </Pressable>
                        </View>
                    </View>
                </Pressable>
            </Modal>
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
        height: 300,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Theme.spacing.lg,
        paddingTop: Theme.spacing.lg,
        paddingBottom: Theme.spacing.md,
    },
    addButton: {
        width: 40,
        height: 40,
        borderRadius: Theme.borderRadius.full,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        paddingHorizontal: Theme.spacing.lg,
    },
    favoritesCard: {
        marginBottom: Theme.spacing.xl,
        padding: 0,
        overflow: 'hidden',
    },
    favoritesContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Theme.spacing.md,
        gap: Theme.spacing.md,
    },
    favoritesIcon: {
        width: 56,
        height: 56,
        borderRadius: Theme.borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    favoritesInfo: {
        flex: 1,
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
        paddingVertical: Theme.spacing.xxl,
    },
    emptyContent: {
        alignItems: 'center',
        gap: Theme.spacing.md,
    },
    emptyText: {
        textAlign: 'center',
    },
    createButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Theme.spacing.xs,
        paddingVertical: Theme.spacing.sm,
        paddingHorizontal: Theme.spacing.md,
        borderRadius: Theme.borderRadius.full,
        marginTop: Theme.spacing.sm,
    },
    playlistList: {
        gap: Theme.spacing.md,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: Theme.spacing.lg,
    },
    modalContent: {
        width: '100%',
        borderRadius: Theme.borderRadius.lg,
        padding: Theme.spacing.lg,
    },
    modalTitle: {
        marginBottom: Theme.spacing.md,
    },
    input: {
        borderRadius: Theme.borderRadius.md,
        padding: Theme.spacing.md,
        fontSize: 16,
        marginBottom: Theme.spacing.md,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: Theme.spacing.md,
    },
    cancelBtn: {
        padding: Theme.spacing.md,
    },
    confirmBtn: {
        paddingVertical: Theme.spacing.sm,
        paddingHorizontal: Theme.spacing.lg,
        borderRadius: Theme.borderRadius.md,
    },
});
