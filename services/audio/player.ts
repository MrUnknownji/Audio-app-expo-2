import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { Track } from './types';

class UnifiedAudioService {
    private sound: Audio.Sound | null = null;
    private statusUpdateCallback: ((status: any) => void) | null = null;
    private isMuted: boolean = false;
    private volume: number = 1.0;
    private playbackRate: number = 1.0;

    // EQ Stubs - expo-av doesn't support 10-band EQ natively
    private eqEnabled: boolean = false;
    private eqGains: number[] = [];

    constructor() {
        this.setupAudio();
    }

    private async setupAudio() {
        try {
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                staysActiveInBackground: true,
                playsInSilentModeIOS: true,
                shouldDuckAndroid: true,
                interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
                interruptionModeIOS: InterruptionModeIOS.DoNotMix,
                playThroughEarpieceAndroid: false
            });
        } catch (error) {
            console.error('Error setting up audio mode:', error);
        }
    }

    async loadTrack(track: Track): Promise<void> {
        try {
            if (this.sound) {
                await this.sound.unloadAsync();
                this.sound = null;
            }

            const { sound } = await Audio.Sound.createAsync(
                { uri: track.uri },
                {
                    shouldPlay: false,
                    volume: this.volume,
                    isMuted: this.isMuted,
                    rate: this.playbackRate
                },
                this.onPlaybackStatusUpdate
            );

            this.sound = sound;
        } catch (error) {
            console.error('Error loading track:', error);
            throw error;
        }
    }

    async play(): Promise<void> {
        if (this.sound) {
            await this.sound.playAsync();
        }
    }

    async pause(): Promise<void> {
        if (this.sound) {
            await this.sound.pauseAsync();
        }
    }

    async stop(): Promise<void> {
        if (this.sound) {
            await this.sound.stopAsync();
        }
    }

    async seekTo(positionMillis: number): Promise<void> {
        if (this.sound) {
            await this.sound.setPositionAsync(positionMillis);
        }
    }

    async setVolume(volume: number): Promise<void> {
        this.volume = volume;
        if (this.sound) {
            await this.sound.setVolumeAsync(volume);
        }
    }

    setMuted(muted: boolean): void {
        this.isMuted = muted;
        if (this.sound) {
            this.sound.setIsMutedAsync(muted);
        }
    }

    setPlaybackRate(rate: number): void {
        this.playbackRate = rate;
        if (this.sound) {
            this.sound.setRateAsync(rate, true);
        }
    }

    setStatusUpdateCallback(callback: (status: any) => void): void {
        this.statusUpdateCallback = callback;
    }

    // Remote controls are platform specific and might need expo-av config or external lib
    // Stubbing for now to prevent crashes
    setRemoteControlCallbacks(callbacks: any): void {
        // Implementation for remote controls would go here
    }

    // EQ Stubs
    setEQBandGain(index: number, gain: number): void {
        this.eqGains[index] = gain;
        // Apply EQ logic if available
    }

    setAllEQBands(gains: number[]): void {
        this.eqGains = gains;
    }

    setEQEnabled(enabled: boolean, gains: number[]): void {
        this.eqEnabled = enabled;
        this.eqGains = gains;
    }

    resetEQ(): void {
        this.eqEnabled = false;
        this.eqGains = [];
    }

    private onPlaybackStatusUpdate = (status: any) => {
        if (this.statusUpdateCallback) {
            this.statusUpdateCallback(status);
        }
    }
}

export const unifiedAudioService = new UnifiedAudioService();
