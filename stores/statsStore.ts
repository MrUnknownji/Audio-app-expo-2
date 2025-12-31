import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Track } from '@/services/audio/types';

interface PlayRecord {
    trackId: string;
    timestamp: number;
    durationMs: number;
}

interface StatsState {
    playCount: Record<string, number>;
    totalListeningTime: number;
    listeningHistory: PlayRecord[];
    hourlyDistribution: number[];
    dailyListeningTime: Record<string, number>;
}

interface StatsActions {
    recordPlay: (track: Track, durationMs: number) => void;
    getTopTracks: (tracks: Track[], limit?: number) => { track: Track; plays: number }[];
    getTopArtists: (tracks: Track[], limit?: number) => { artist: string; plays: number; time: number }[];
    getTodayListeningTime: () => number;
    getWeeklyData: () => { day: string; time: number }[];
    getStreak: () => number;
    resetStats: () => void;
}

type StatsStore = StatsState & StatsActions;

const MAX_HISTORY_SIZE = 1000;
const MINIMUM_PLAY_DURATION = 30000;

function getDateKey(timestamp: number): string {
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getDayName(dateKey: string): string {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const date = new Date(dateKey);
    return days[date.getDay()];
}

export const useStatsStore = create<StatsStore>()(
    persist(
        (set, get) => ({
            playCount: {},
            totalListeningTime: 0,
            listeningHistory: [],
            hourlyDistribution: new Array(24).fill(0),
            dailyListeningTime: {},

            recordPlay: (track: Track, durationMs: number) => {
                if (durationMs < MINIMUM_PLAY_DURATION) return;

                const now = Date.now();
                const hour = new Date(now).getHours();
                const dateKey = getDateKey(now);

                set((state) => {
                    const newPlayCount = { ...state.playCount };
                    newPlayCount[track.id] = (newPlayCount[track.id] || 0) + 1;

                    const newHourly = [...state.hourlyDistribution];
                    newHourly[hour] += durationMs;

                    const newDaily = { ...state.dailyListeningTime };
                    newDaily[dateKey] = (newDaily[dateKey] || 0) + durationMs;

                    const newRecord: PlayRecord = {
                        trackId: track.id,
                        timestamp: now,
                        durationMs,
                    };

                    const newHistory = [newRecord, ...state.listeningHistory].slice(0, MAX_HISTORY_SIZE);

                    return {
                        playCount: newPlayCount,
                        totalListeningTime: state.totalListeningTime + durationMs,
                        listeningHistory: newHistory,
                        hourlyDistribution: newHourly,
                        dailyListeningTime: newDaily,
                    };
                });
            },

            getTopTracks: (tracks: Track[], limit = 10) => {
                const { playCount } = get();
                const trackMap = new Map(tracks.map(t => [t.id, t]));

                return Object.entries(playCount)
                    .filter(([id]) => trackMap.has(id))
                    .map(([id, plays]) => ({ track: trackMap.get(id)!, plays }))
                    .sort((a, b) => b.plays - a.plays)
                    .slice(0, limit);
            },

            getTopArtists: (tracks: Track[], limit = 10) => {
                const { playCount, listeningHistory } = get();
                const trackMap = new Map(tracks.map(t => [t.id, t]));

                const artistStats: Record<string, { plays: number; time: number }> = {};

                Object.entries(playCount).forEach(([trackId, plays]) => {
                    const track = trackMap.get(trackId);
                    if (track) {
                        if (!artistStats[track.artist]) {
                            artistStats[track.artist] = { plays: 0, time: 0 };
                        }
                        artistStats[track.artist].plays += plays;
                    }
                });

                listeningHistory.forEach((record) => {
                    const track = trackMap.get(record.trackId);
                    if (track && artistStats[track.artist]) {
                        artistStats[track.artist].time += record.durationMs;
                    }
                });

                return Object.entries(artistStats)
                    .map(([artist, stats]) => ({ artist, ...stats }))
                    .sort((a, b) => b.plays - a.plays)
                    .slice(0, limit);
            },

            getTodayListeningTime: () => {
                const { dailyListeningTime } = get();
                const today = getDateKey(Date.now());
                return dailyListeningTime[today] || 0;
            },

            getWeeklyData: () => {
                const { dailyListeningTime } = get();
                const result: { day: string; time: number }[] = [];

                for (let i = 6; i >= 0; i--) {
                    const date = new Date();
                    date.setDate(date.getDate() - i);
                    const dateKey = getDateKey(date.getTime());
                    result.push({
                        day: getDayName(dateKey),
                        time: dailyListeningTime[dateKey] || 0,
                    });
                }

                return result;
            },

            getStreak: () => {
                const { dailyListeningTime } = get();
                let streak = 0;
                const today = new Date();

                for (let i = 0; i < 365; i++) {
                    const date = new Date(today);
                    date.setDate(date.getDate() - i);
                    const dateKey = getDateKey(date.getTime());

                    if (dailyListeningTime[dateKey] && dailyListeningTime[dateKey] > 0) {
                        streak++;
                    } else if (i > 0) {
                        break;
                    }
                }

                return streak;
            },

            resetStats: () => {
                set({
                    playCount: {},
                    totalListeningTime: 0,
                    listeningHistory: [],
                    hourlyDistribution: new Array(24).fill(0),
                    dailyListeningTime: {},
                });
            },
        }),
        {
            name: 'audio-vibes-stats',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
