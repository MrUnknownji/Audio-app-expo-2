import React from 'react';
import { View, StyleSheet, ScrollView, Pressable, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '@/constants/theme';
import { Title, Body, Caption, GlassCard } from '@/components/ui';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useThemeStore } from '@/stores/themeStore';
import { useSettingsStore } from '@/stores/settingsStore';

type SettingItemProps = {
    icon: keyof typeof Ionicons.glyphMap;
    iconColor?: string;
    title: string;
    subtitle?: string;
    rightElement?: React.ReactNode;
    onPress?: () => void;
    colors: ReturnType<typeof useTheme>['colors'];
};

function SettingItem({ icon, iconColor, title, subtitle, rightElement, onPress, colors }: SettingItemProps) {
    return (
        <Pressable
            style={({ pressed }) => [styles.settingItem, pressed && { backgroundColor: colors.surfaceElevated }]}
            onPress={onPress}
        >
            <View style={[styles.settingIcon, { backgroundColor: iconColor ? `${iconColor}20` : colors.primaryMuted }]}>
                <Ionicons name={icon} size={20} color={iconColor || colors.primary} />
            </View>
            <View style={styles.settingContent}>
                <Body>{title}</Body>
                {subtitle && <Caption>{subtitle}</Caption>}
            </View>
            {rightElement !== undefined ? rightElement : <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />}
        </Pressable>
    );
}

function SettingSection({ title, children, colors }: { title: string; children: React.ReactNode; colors: ReturnType<typeof useTheme>['colors'] }) {
    return (
        <View style={styles.section}>
            <Caption style={styles.sectionTitle}>{title}</Caption>
            <GlassCard style={styles.sectionCard}>
                {children}
            </GlassCard>
        </View>
    );
}

export default function SettingsScreen() {
    const router = useRouter();
    const { colors, isDark, toggleMode, dynamicColors, setDynamicColors } = useTheme();
    const { followSystem, setFollowSystem } = useThemeStore();
    const { crossfadeDuration, gaplessPlayback, shakeToShuffle, setCrossfadeDuration, setGaplessPlayback, setShakeToShuffle } = useSettingsStore();
    const [haptics, setHaptics] = React.useState(true);

    const formatCrossfade = (seconds: number) => {
        if (seconds === 0) return 'Off';
        return `${seconds}s`;
    };

    const cycleCrossfade = () => {
        const options = [0, 2, 4, 6, 8, 10, 12];
        const currentIndex = options.indexOf(crossfadeDuration);
        const nextIndex = (currentIndex + 1) % options.length;
        setCrossfadeDuration(options[nextIndex]);
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <View style={styles.header}>
                    <Title>Settings</Title>
                </View>

                <ScrollView
                    style={styles.content}
                    contentContainerStyle={styles.contentContainer}
                    showsVerticalScrollIndicator={false}
                >
                    <SettingSection title="APPEARANCE" colors={colors}>
                        <SettingItem
                            icon="moon"
                            iconColor={colors.secondary}
                            title="Dark Mode"
                            subtitle={isDark ? 'On' : 'Off'}
                            colors={colors}
                            rightElement={
                                <Switch
                                    value={isDark}
                                    onValueChange={toggleMode}
                                    trackColor={{ false: colors.border, true: colors.primary }}
                                    thumbColor={colors.text}
                                />
                            }
                        />
                        <View style={[styles.divider, { backgroundColor: colors.border }]} />
                        <SettingItem
                            icon="phone-portrait"
                            iconColor="#22C55E"
                            title="Follow System"
                            subtitle={followSystem ? 'Enabled' : 'Disabled'}
                            colors={colors}
                            rightElement={
                                <Switch
                                    value={followSystem}
                                    onValueChange={setFollowSystem}
                                    trackColor={{ false: colors.border, true: colors.primary }}
                                    thumbColor={colors.text}
                                />
                            }
                        />
                        <View style={[styles.divider, { backgroundColor: colors.border }]} />
                        <SettingItem
                            icon="color-palette"
                            iconColor="#F472B6"
                            title="Dynamic Colors"
                            subtitle={dynamicColors ? 'From album art' : 'Default theme'}
                            colors={colors}
                            rightElement={
                                <Switch
                                    value={dynamicColors}
                                    onValueChange={setDynamicColors}
                                    trackColor={{ false: colors.border, true: colors.primary }}
                                    thumbColor={colors.text}
                                />
                            }
                        />
                        <Caption color={colors.textMuted} style={{ paddingHorizontal: Theme.spacing.lg, paddingBottom: Theme.spacing.md }}>
                            ⚠️ Use with caution, may cause blindness
                        </Caption>
                    </SettingSection>

                    <SettingSection title="PLAYBACK" colors={colors}>
                        <SettingItem
                            icon="git-compare"
                            iconColor={colors.primary}
                            title="Crossfade"
                            subtitle={formatCrossfade(crossfadeDuration)}
                            colors={colors}
                            onPress={cycleCrossfade}
                            rightElement={
                                <Body color={crossfadeDuration > 0 ? colors.primary : colors.textMuted}>
                                    {formatCrossfade(crossfadeDuration)}
                                </Body>
                            }
                        />
                        <View style={[styles.divider, { backgroundColor: colors.border }]} />
                        <SettingItem
                            icon="link"
                            iconColor={colors.secondary}
                            title="Gapless Playback"
                            subtitle="Seamless transitions"
                            colors={colors}
                            rightElement={
                                <Switch
                                    value={gaplessPlayback}
                                    onValueChange={setGaplessPlayback}
                                    trackColor={{ false: colors.border, true: colors.primary }}
                                    thumbColor={colors.text}
                                />
                            }
                        />
                    </SettingSection>

                    <SettingSection title="INSIGHTS" colors={colors}>
                        <SettingItem
                            icon="bar-chart"
                            iconColor="#8B5CF6"
                            title="Listening Statistics"
                            subtitle="Your music habits"
                            colors={colors}
                            onPress={() => router.navigate({ pathname: '/stats' })}
                        />
                    </SettingSection>

                    <SettingSection title="AUDIO" colors={colors}>
                        <SettingItem
                            icon="cellular"
                            iconColor={colors.primary}
                            title="Equalizer"
                            subtitle="Custom presets"
                            colors={colors}
                            onPress={() => router.push('/equalizer')}
                        />
                    </SettingSection>



                    <SettingSection title="EXPERIENCE" colors={colors}>
                        <SettingItem
                            icon="hardware-chip"
                            iconColor={colors.primary}
                            title="Haptic Feedback"
                            colors={colors}
                            rightElement={
                                <Switch
                                    value={haptics}
                                    onValueChange={setHaptics}
                                    trackColor={{ false: colors.border, true: colors.primary }}
                                    thumbColor={colors.text}
                                />
                            }
                        />
                        <View style={[styles.divider, { backgroundColor: colors.border }]} />
                        <SettingItem
                            icon="phone-portrait"
                            iconColor="#F59E0B"
                            title="Shake to Shuffle"
                            subtitle={shakeToShuffle ? 'Enabled' : 'Disabled'}
                            colors={colors}
                            rightElement={
                                <Switch
                                    value={shakeToShuffle}
                                    onValueChange={setShakeToShuffle}
                                    trackColor={{ false: colors.border, true: colors.primary }}
                                    thumbColor={colors.text}
                                />
                            }
                        />
                        <View style={[styles.divider, { backgroundColor: colors.border }]} />
                        <SettingItem
                            icon="car"
                            iconColor="#3B82F6"
                            title="Driving Mode"
                            subtitle="Large controls for driving"
                            colors={colors}
                            onPress={() => router.navigate({ pathname: '/driving' })}
                        />
                    </SettingSection>

                    <SettingSection title="ABOUT" colors={colors}>
                        <SettingItem
                            icon="information-circle"
                            iconColor={colors.textMuted}
                            title="Version"
                            subtitle="1.0.0"
                            colors={colors}
                            rightElement={null}
                        />
                    </SettingSection>

                    <View style={styles.footer}>
                        <Caption style={styles.footerText}>Made with 💜 for music lovers</Caption>
                        <Caption style={styles.footerText}>100% Free · No Ads · No Tracking</Caption>
                    </View>

                    <View style={{ height: 100 }} />
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
        paddingHorizontal: Theme.spacing.lg,
        paddingTop: Theme.spacing.lg,
        paddingBottom: Theme.spacing.md,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        paddingHorizontal: Theme.spacing.lg,
    },
    section: {
        marginBottom: Theme.spacing.lg,
    },
    sectionTitle: {
        marginBottom: Theme.spacing.sm,
        marginLeft: Theme.spacing.xs,
        letterSpacing: 1,
    },
    sectionCard: {
        padding: 0,
        overflow: 'hidden',
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Theme.spacing.md,
        gap: Theme.spacing.md,
    },
    settingIcon: {
        width: 36,
        height: 36,
        borderRadius: Theme.borderRadius.sm,
        alignItems: 'center',
        justifyContent: 'center',
    },
    settingContent: {
        flex: 1,
    },
    divider: {
        height: 1,
        marginLeft: 60,
    },
    footer: {
        alignItems: 'center',
        paddingVertical: Theme.spacing.xl,
    },
    footerText: {
        textAlign: 'center',
        marginBottom: Theme.spacing.xs,
    },
});
