import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '@/constants/theme';
import { MiniPlayer } from '@/components/player';
import { usePlayer } from '@/hooks/usePlayer';
import { useTheme } from '@/hooks/useTheme';
import { useShakeDetector } from '@/hooks/useShakeDetector';
import * as Haptics from 'expo-haptics';

type TabIconProps = {
    name: keyof typeof Ionicons.glyphMap;
    color: string;
    focused: boolean;
};

function TabIcon({ name, color, focused }: TabIconProps) {
    const { colors } = useTheme();

    return (
        <View style={[
            styles.iconContainer,
            focused && [styles.iconFocused, { backgroundColor: colors.primaryMuted }]
        ]}>
            <Ionicons name={name} size={22} color={color} />
        </View>
    );
}

export default function TabLayout() {
    const { colors } = useTheme();
    const { currentTrack } = usePlayer();

    // Initialize shake to shuffle detector
    useShakeDetector();

    const handleTabPress = () => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarStyle: [
                        styles.tabBar,
                        {
                            backgroundColor: colors.surface,
                            borderTopColor: colors.border,
                            // Neumorphic shadow
                            shadowColor: colors.shadowDark,
                            shadowOffset: { width: 0, height: -4 },
                            shadowOpacity: 1,
                            shadowRadius: 8,
                            elevation: 10,
                        }
                    ],
                    tabBarActiveTintColor: colors.primary,
                    tabBarInactiveTintColor: colors.textMuted,
                    tabBarShowLabel: true,
                    tabBarLabelStyle: styles.tabLabel,
                    sceneStyle: { backgroundColor: colors.background },
                }}
                screenListeners={{
                    tabPress: handleTabPress,
                }}
            >
                <Tabs.Screen
                    name="index"
                    options={{
                        title: 'Home',
                        tabBarIcon: ({ color, focused }) => (
                            <TabIcon
                                name={focused ? 'home' : 'home-outline'}
                                color={color}
                                focused={focused}
                            />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="library"
                    options={{
                        title: 'Library',
                        tabBarIcon: ({ color, focused }) => (
                            <TabIcon
                                name={focused ? 'library' : 'library-outline'}
                                color={color}
                                focused={focused}
                            />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="playlists"
                    options={{
                        title: 'Playlists',
                        tabBarIcon: ({ color, focused }) => (
                            <TabIcon
                                name={focused ? 'list' : 'list-outline'}
                                color={color}
                                focused={focused}
                            />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="settings"
                    options={{
                        title: 'Settings',
                        tabBarIcon: ({ color, focused }) => (
                            <TabIcon
                                name={focused ? 'settings' : 'settings-outline'}
                                color={color}
                                focused={focused}
                            />
                        ),
                    }}
                />
            </Tabs>

            {/* MiniPlayer positioned above tab bar */}
            {currentTrack && (
                <View style={[styles.miniPlayerWrapper, { bottom: Platform.OS === 'ios' ? 88 : 64 }]}>
                    <MiniPlayer />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    tabBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTopWidth: 0,
        height: Platform.OS === 'ios' ? 88 : 64,
        paddingTop: Theme.spacing.xs,
        paddingBottom: Platform.OS === 'ios' ? 28 : Theme.spacing.sm,
    },
    tabLabel: {
        fontSize: 10,
        fontWeight: '500',
        marginTop: 2,
    },
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 44,
        height: 32,
        borderRadius: 16,
    },
    iconFocused: {
        // Filled in dynamically
    },
    miniPlayerWrapper: {
        position: 'absolute',
        left: 0,
        right: 0,
        zIndex: 100,
    },
});
