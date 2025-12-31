// Import polyfills first - must be before any other imports
import '@/utils/polyfills';

import { Stack } from 'expo-router';
import { StyleSheet, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { TamaguiProvider } from 'tamagui';
import appConfig from '../tamagui.config';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { ToastProvider } from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';

function AppContent() {
    const { colors } = useTheme();

    return (
        <GestureHandlerRootView style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack
                screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: colors.background },
                    animation: 'fade',
                }}
            >
                <Stack.Screen name="(tabs)" />
                <Stack.Screen
                    name="player"
                    options={{
                        presentation: 'modal',
                        animation: 'slide_from_bottom',
                    }}
                />
                <Stack.Screen
                    name="queue"
                    options={{
                        presentation: 'modal',
                        animation: 'slide_from_bottom',
                    }}
                />
                <Stack.Screen
                    name="search"
                    options={{
                        animation: 'fade_from_bottom',
                    }}
                />
                <Stack.Screen
                    name="playlist/[id]"
                    options={{
                        animation: 'slide_from_right',
                    }}
                />
                <Stack.Screen
                    name="equalizer"
                    options={{
                        presentation: 'modal',
                        animation: 'slide_from_bottom',
                    }}
                />
                <Stack.Screen
                    name="stats"
                    options={{
                        animation: 'slide_from_right',
                    }}
                />
                <Stack.Screen
                    name="driving"
                    options={{
                        presentation: 'fullScreenModal',
                        animation: 'fade',
                    }}
                />
            </Stack>
        </GestureHandlerRootView>
    );
}

export default function RootLayout() {
    const colorScheme = useColorScheme();

    return (
        <TamaguiProvider config={appConfig} defaultTheme={colorScheme ?? 'dark'}>
            <ThemeProvider>
                <ToastProvider>
                    <AppContent />
                </ToastProvider>
            </ThemeProvider>
        </TamaguiProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
