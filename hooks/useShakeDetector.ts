import { useEffect, useRef, useCallback } from 'react';
import { Accelerometer } from 'expo-sensors';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSettingsStore } from '@/stores/settingsStore';
import { usePlayerStore } from '@/stores/playerStore';

const SHAKE_THRESHOLD = 2.5;
const SHAKE_COOLDOWN_MS = 1500;

export function useShakeDetector() {
    const lastShakeTime = useRef(0);
    const { shakeToShuffle } = useSettingsStore();
    const { toggleShuffle, isPlaying } = usePlayerStore();

    const handleShake = useCallback(() => {
        const now = Date.now();
        if (now - lastShakeTime.current < SHAKE_COOLDOWN_MS) return;

        lastShakeTime.current = now;

        if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        toggleShuffle();
    }, [toggleShuffle]);

    useEffect(() => {
        if (!shakeToShuffle || !isPlaying) return;
        if (Platform.OS === 'web') return;

        let subscription: ReturnType<typeof Accelerometer.addListener> | null = null;

        const startListening = async () => {
            const available = await Accelerometer.isAvailableAsync();
            if (!available) return;

            Accelerometer.setUpdateInterval(100);

            subscription = Accelerometer.addListener(({ x, y, z }) => {
                const acceleration = Math.sqrt(x * x + y * y + z * z);

                if (acceleration > SHAKE_THRESHOLD) {
                    handleShake();
                }
            });
        };

        startListening();

        return () => {
            subscription?.remove();
        };
    }, [shakeToShuffle, isPlaying, handleShake]);
}
