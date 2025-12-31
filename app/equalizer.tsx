import React from 'react';
import { View, StyleSheet, ScrollView, Pressable, Switch, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '@/constants/theme';
import { Title, Body, Caption, GlassCard } from '@/components/ui';
import { useEqualizerStore, EQ_PRESETS } from '@/stores/equalizerStore';
import { EqualizerBand } from '@/components/equalizer/EqualizerBand';
import { useTheme } from '@/hooks/useTheme';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function EqualizerScreen() {
    const router = useRouter();
    const { colors } = useTheme();
    const {
        bands,
        isEnabled,
        currentPresetId,
        setEnabled,
        setBandGain,
        selectPreset,
        resetToFlat,
        saveAsCustom
    } = useEqualizerStore();

    const handleBack = () => {
        router.back();
    };

    const handleReset = () => {
        resetToFlat();
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <LinearGradient
                colors={[colors.background, `${colors.secondary}1A`]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <Pressable onPress={handleBack} style={[styles.iconButton, { backgroundColor: colors.surfaceElevated }]}>
                        <Ionicons name="chevron-down" size={28} color={colors.text} />
                    </Pressable>
                    <Title style={styles.title}>Equalizer</Title>
                    <Pressable onPress={handleReset} style={[styles.iconButton, { backgroundColor: colors.surfaceElevated }]}>
                        <Ionicons name="refresh" size={24} color={colors.text} />
                    </Pressable>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

                    {/* Toggle Switch */}
                    <GlassCard style={styles.paramCard}>
                        <View style={styles.paramRow}>
                            <View style={styles.paramInfo}>
                                <Body style={styles.paramTitle}>Enable Equalizer</Body>
                                <Caption>Apply audio adjustments</Caption>
                            </View>
                            <Switch
                                value={isEnabled}
                                onValueChange={(v) => {
                                    setEnabled(v);
                                    Haptics.selectionAsync();
                                }}
                                trackColor={{ false: colors.border, true: colors.primary }}
                                thumbColor={colors.text}
                            />
                        </View>
                    </GlassCard>

                    {/* Presets Carousel */}
                    <View style={styles.presetsContainer}>
                        <Caption style={styles.sectionLabel}>PRESETS</Caption>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.presetsList}
                        >
                            {EQ_PRESETS.map((preset) => {
                                const isActive = currentPresetId === preset.id;
                                return (
                                    <Pressable
                                        key={preset.id}
                                        onPress={() => selectPreset(preset.id)}
                                        style={[
                                            styles.presetChip,
                                            { backgroundColor: colors.surfaceElevated, borderColor: 'transparent' },
                                            isActive && { backgroundColor: 'transparent', borderColor: colors.primary }
                                        ]}
                                    >
                                        <Ionicons
                                            name={preset.icon}
                                            size={16}
                                            color={isActive ? colors.primary : colors.textMuted}
                                        />
                                        <Caption style={{ color: isActive ? colors.primary : colors.textMuted, fontWeight: isActive ? '700' : '500' }}>
                                            {preset.name}
                                        </Caption>
                                    </Pressable>
                                );
                            })}
                        </ScrollView>
                    </View>

                    {/* EQ Bands */}
                    <View style={[styles.bandsContainer, !isEnabled && styles.disabledContainer]}>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.bandsList}
                        >
                            {bands.map((band, index) => (
                                <EqualizerBand
                                    key={band.frequency}
                                    frequency={band.label}
                                    gain={band.gain}
                                    onChange={(val) => setBandGain(index, val)}
                                    color={colors.primary}
                                />
                            ))}
                        </ScrollView>
                    </View>

                    {/* Save Custom Button */}
                    {currentPresetId === 'custom' && (
                        <Pressable
                            style={[styles.saveButton, { backgroundColor: colors.surfaceElevated }]}
                            onPress={saveAsCustom}
                        >
                            <Ionicons name="save-outline" size={20} color={colors.text} />
                            <Body>Save as Custom Preset</Body>
                        </Pressable>
                    )}

                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Theme.spacing.lg,
        paddingTop: Theme.spacing.md,
        paddingBottom: Theme.spacing.lg,
    },
    title: {
        fontSize: 20,
    },
    iconButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
    },
    content: {
        paddingBottom: 40,
    },
    paramCard: {
        marginHorizontal: Theme.spacing.lg,
        marginBottom: Theme.spacing.xl,
    },
    paramRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    paramInfo: {
        flex: 1,
    },
    paramTitle: {
        fontWeight: '600',
        marginBottom: 2,
    },
    presetsContainer: {
        marginBottom: Theme.spacing.xl,
    },
    sectionLabel: {
        marginLeft: Theme.spacing.lg,
        marginBottom: Theme.spacing.md,
        opacity: 0.6,
        letterSpacing: 1,
    },
    presetsList: {
        paddingHorizontal: Theme.spacing.lg,
        gap: Theme.spacing.sm,
    },
    presetChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Theme.spacing.md,
        paddingVertical: 8,
        borderRadius: Theme.borderRadius.full,
        gap: 6,
        borderWidth: 1,
    },
    bandsContainer: {
        height: 280,
    },
    disabledContainer: {
        opacity: 0.5,
        pointerEvents: 'none',
    },
    bandsList: {
        paddingHorizontal: Theme.spacing.lg,
        alignItems: 'center',
        gap: 12,
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: Theme.spacing.lg,
        padding: Theme.spacing.md,
        borderRadius: Theme.borderRadius.lg,
        gap: Theme.spacing.sm,
        marginTop: Theme.spacing.md,
    },
});
