import { unifiedAudioService } from './player';

const FREQUENCIES = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

export type BiquadFilterType = 'lowshelf' | 'peaking' | 'highshelf';

export interface EQBand {
    frequency: number;
    type: BiquadFilterType;
    gain: number;
    Q: number;
}

class AudioEQService {
    private isEnabled: boolean = true;
    private currentGains: number[] = new Array(FREQUENCIES.length).fill(0);

    setBandGain(index: number, gain: number): void {
        if (index >= 0 && index < FREQUENCIES.length) {
            this.currentGains[index] = gain;
            if (this.isEnabled) {
                unifiedAudioService.setEQBandGain(index, gain);
            }
        }
    }

    setAllBands(gains: number[]): void {
        this.currentGains = [...gains];
        if (this.isEnabled) {
            unifiedAudioService.setAllEQBands(gains);
        }
    }

    setEnabled(enabled: boolean): void {
        this.isEnabled = enabled;
        unifiedAudioService.setEQEnabled(enabled, this.currentGains);
    }

    reset(): void {
        this.currentGains = new Array(FREQUENCIES.length).fill(0);
        unifiedAudioService.resetEQ();
    }

    getCurrentGains(): number[] {
        return [...this.currentGains];
    }

    getIsEnabled(): boolean {
        return this.isEnabled;
    }
}

export const audioEQ = new AudioEQService();
