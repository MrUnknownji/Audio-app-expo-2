import React, { createContext, useContext, useState, useCallback } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '@/constants/theme';
import { Body } from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
    const { colors } = useTheme();
    const translateY = useSharedValue(-100);

    React.useEffect(() => {
        translateY.value = withTiming(0, { duration: 250 });

        const timeout = setTimeout(() => {
            translateY.value = withTiming(-100, { duration: 200 }, () => {
                runOnJS(onDismiss)();
            });
        }, 2500);

        return () => clearTimeout(timeout);
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    const getIcon = (): keyof typeof Ionicons.glyphMap => {
        switch (toast.type) {
            case 'success': return 'checkmark-circle';
            case 'error': return 'alert-circle';
            default: return 'information-circle';
        }
    };

    const getColor = () => {
        switch (toast.type) {
            case 'success': return colors.success;
            case 'error': return colors.error;
            default: return colors.primary;
        }
    };

    return (
        <Animated.View style={[styles.toast, { backgroundColor: colors.surface }, animatedStyle]}>
            <Ionicons name={getIcon()} size={22} color={getColor()} />
            <Body style={styles.toastText} numberOfLines={2}>{toast.message}</Body>
        </Animated.View>
    );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const insets = useSafeAreaInsets();

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        if (Platform.OS !== 'web') {
            if (type === 'error') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            } else if (type === 'success') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
        }

        const id = Date.now().toString();
        setToasts(prev => [...prev, { id, message, type }]);
    }, []);

    const dismissToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <View style={[styles.container, { top: insets.top + 10 }]} pointerEvents="none">
                {toasts.map(toast => (
                    <ToastItem
                        key={toast.id}
                        toast={toast}
                        onDismiss={() => dismissToast(toast.id)}
                    />
                ))}
            </View>
        </ToastContext.Provider>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: Theme.spacing.lg,
        right: Theme.spacing.lg,
        zIndex: 9999,
    },
    toast: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Theme.spacing.sm,
        padding: Theme.spacing.md,
        borderRadius: Theme.borderRadius.md,
        marginBottom: Theme.spacing.sm,
        ...Theme.shadows.lg,
    },
    toastText: {
        flex: 1,
    },
});
