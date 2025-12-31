import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

interface GlassCardProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    variant?: 'default' | 'elevated' | 'outlined';
    gradient?: boolean;
}

export function GlassCard({
    children,
    style,
    variant = 'default',
    gradient = false
}: GlassCardProps) {
    const { colors } = useTheme();

    const containerStyle = [
        styles.container,
        { borderColor: colors.border },
        variant === 'elevated' && styles.elevated,
        variant === 'outlined' && styles.outlined,
        style,
    ];

    if (gradient) {
        return (
            <LinearGradient
                colors={[
                    `${colors.primary}1A`,
                    `${colors.secondary}0D`,
                    'transparent',
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={containerStyle}
            >
                {children}
            </LinearGradient>
        );
    }

    return (
        <View style={[containerStyle, { backgroundColor: colors.surfaceGlass }]}>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: Theme.borderRadius.lg,
        padding: Theme.spacing.md,
        borderWidth: 1,
    },
    elevated: {
        ...Theme.shadows.md,
    },
    outlined: {
        backgroundColor: 'transparent',
    },
});
