import React, { useRef, useState } from 'react';
import { View, StyleSheet, Text, PanResponder } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '@/constants/theme';
import { Caption } from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';

interface EqualizerBandProps {
    frequency: string;
    gain: number;
    onChange: (gain: number) => void;
    minGain?: number;
    maxGain?: number;
    color?: string;
}

const BAND_HEIGHT = 200;
const THUMB_SIZE = 24;

export function EqualizerBand({
    frequency,
    gain,
    onChange,
    minGain = -12,
    maxGain = 12,
    color,
}: EqualizerBandProps) {
    const { colors } = useTheme();
    const effectiveColor = color || colors.primary;
    const gainRange = maxGain - minGain;
    const [isDragging, setIsDragging] = useState(false);
    const startY = useRef(0);
    const startGain = useRef(gain);

    const gainToY = (g: number) => {
        const normalized = (g - minGain) / gainRange;
        return BAND_HEIGHT * (1 - normalized);
    };

    const yToGain = (y: number) => {
        const clampedY = Math.max(0, Math.min(BAND_HEIGHT, y));
        const normalized = 1 - (clampedY / BAND_HEIGHT);
        return Math.round(minGain + (normalized * gainRange));
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: (_, gestureState) => {
                setIsDragging(true);
                startY.current = gainToY(gain);
                startGain.current = gain;
            },
            onPanResponderMove: (_, gestureState) => {
                const newY = startY.current + gestureState.dy;
                const newGain = yToGain(newY);
                if (newGain !== startGain.current) {
                    startGain.current = newGain;
                    onChange(newGain);
                }
            },
            onPanResponderRelease: () => {
                setIsDragging(false);
            },
            onPanResponderTerminate: () => {
                setIsDragging(false);
            },
        })
    ).current;

    const thumbY = gainToY(gain);
    const fillHeight = BAND_HEIGHT - thumbY;

    return (
        <View style={styles.container}>
            <View style={styles.trackContainer}>
                <View {...panResponder.panHandlers} style={styles.gestureArea}>
                    <View style={[styles.track, { backgroundColor: colors.surfaceElevated }]} />
                    <View style={[styles.centerLine, { top: BAND_HEIGHT / 2, backgroundColor: colors.border }]} />
                    <View style={[styles.fill, { height: fillHeight }]}>
                        <LinearGradient
                            colors={[effectiveColor, `${effectiveColor}00`]}
                            style={StyleSheet.absoluteFill}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 0, y: 1 }}
                        />
                    </View>
                    <View
                        style={[
                            styles.thumb,
                            {
                                borderColor: effectiveColor,
                                transform: [{ translateY: thumbY - THUMB_SIZE / 2 }],
                                backgroundColor: colors.surfaceElevated,
                            },
                        ]}
                    />
                </View>
            </View>

            <View style={styles.labels}>
                <Caption style={styles.frequency}>{frequency}</Caption>
                <Text style={[styles.gainValue, { color: colors.text }]}>
                    {gain > 0 ? '+' : ''}{gain}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        width: 60,
    },
    trackContainer: {
        height: BAND_HEIGHT,
        width: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Theme.spacing.sm,
    },
    gestureArea: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    track: {
        position: 'absolute',
        width: 4,
        height: '100%',
        borderRadius: 2,
    },
    centerLine: {
        position: 'absolute',
        width: 12,
        height: 2,
        borderRadius: 1,
    },
    fill: {
        position: 'absolute',
        bottom: 0,
        width: 4,
        borderRadius: 2,
        overflow: 'hidden',
        opacity: 0.8,
    },
    thumb: {
        position: 'absolute',
        top: 0,
        width: THUMB_SIZE,
        height: THUMB_SIZE,
        borderRadius: THUMB_SIZE / 2,
        borderWidth: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 4,
    },
    labels: {
        alignItems: 'center',
        gap: 2,
    },
    frequency: {
        fontSize: 10,
        opacity: 0.7,
    },
    gainValue: {
        fontSize: 10,
        fontWeight: '700',
        fontVariant: ['tabular-nums'],
    },
});
