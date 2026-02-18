import AsyncStorage from '@react-native-async-storage/async-storage';
import { Event, Goal, UserProfile, DEFAULT_GOALS } from '../types';
import { notificationService } from './notificationService';

const KEYS = {
    EVENTS: 'task_man_events_v2',
    GOALS: 'task_man_goals',
    PROFILE: 'task_man_profile',
    IS_LOGGED_IN: 'task_man_is_logged_in',
};

// Seeding Data
const SAMPLE_EVENTS: Event[] = [
    { id: 'e1', title: '모닝 커피 마시기', date: new Date().toISOString().split('T')[0], goalId: 'g1', completed: true, isRoutine: true },
    { id: 'e2', title: '개발 팀 회의 준비', date: new Date().toISOString().split('T')[0], goalId: 'g2', completed: false, startTime: '10:00' },
    { id: 'e3', title: 'React Native강의 듣기', date: new Date().toISOString().split('T')[0], goalId: 'g2', completed: false, startTime: '14:00' },
    { id: 'e4', title: '헬스장 가기 (하체)', date: new Date().toISOString().split('T')[0], goalId: 'g3', completed: false },
    { id: 'e5', title: '비타민 챙겨 먹기', date: new Date().toISOString().split('T')[0], goalId: 'g4', completed: false, isRoutine: true },
];

export const db = {
    // --- Events ---
    getEvents: async (): Promise<Event[]> => {
        try {
            const jsonValue = await AsyncStorage.getItem(KEYS.EVENTS);
            if (jsonValue != null) {
                return JSON.parse(jsonValue);
            }
            // Seed if empty for demo
            await AsyncStorage.setItem(KEYS.EVENTS, JSON.stringify(SAMPLE_EVENTS));
            return SAMPLE_EVENTS;
        } catch (e) {
            console.error('Failed to load events', e);
            return [];
        }
    },

    saveEvents: async (events: Event[]) => {
        try {
            const jsonValue = JSON.stringify(events);
            await AsyncStorage.setItem(KEYS.EVENTS, jsonValue);
            // Schedule daily briefings based on updated events
            await notificationService.scheduleDailyBriefings(events);
        } catch (e) {
            console.error('Failed to save events', e);
        }
    },

    // --- Goals ---
    getGoals: async (): Promise<Goal[]> => {
        try {
            const jsonValue = await AsyncStorage.getItem(KEYS.GOALS);
            if (jsonValue != null) {
                return JSON.parse(jsonValue);
            }
            // Initialize default goals
            await AsyncStorage.setItem(KEYS.GOALS, JSON.stringify(DEFAULT_GOALS));
            return DEFAULT_GOALS;
        } catch (e) {
            return DEFAULT_GOALS;
        }
    },

    saveGoals: async (goals: Goal[]) => {
        try {
            await AsyncStorage.setItem(KEYS.GOALS, JSON.stringify(goals));
        } catch (e) {
            console.error('Failed to save goals', e);
        }
    },

    addGoal: async (newGoal: Goal) => {
        const goals = await db.getGoals();
        await db.saveGoals([...goals, newGoal]);
    },

    // --- Profile ---
    getProfile: async (): Promise<UserProfile> => {
        try {
            const jsonValue = await AsyncStorage.getItem(KEYS.PROFILE);
            if (jsonValue != null) {
                return JSON.parse(jsonValue);
            }
            const defaultProfile: UserProfile = {
                name: '대표님',
                avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop',
                role: 'Solo CEO',
                dailyGoalHours: 4,
                level: 1,
                xp: 0,
                streak: 0,
            };
            await AsyncStorage.setItem(KEYS.PROFILE, JSON.stringify(defaultProfile));
            return defaultProfile;
        } catch (e) {
            return { name: '대표님', avatar: '', role: 'CEO', dailyGoalHours: 4, level: 1, xp: 0, streak: 0 };
        }
    },

    saveProfile: async (profile: UserProfile) => {
        try {
            await AsyncStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
        } catch (e) {
            console.error('Failed to save profile', e);
        }
    },

    addXP: async (amount: number) => {
        const profile = await db.getProfile();
        let newXp = profile.xp + amount;
        let newLevel = profile.level;

        // Simple level up logic: level * 100 XP needed
        const nextLevelXp = newLevel * 100;
        if (newXp >= nextLevelXp) {
            newXp -= nextLevelXp;
            newLevel += 1;
            // Alert or callback could go here
        }

        await db.saveProfile({ ...profile, xp: newXp, level: newLevel });
        return { leveledUp: newLevel > profile.level, newLevel };
    },

    updateStreak: async () => {
        const profile = await db.getProfile();
        const today = new Date().toISOString().split('T')[0];
        const lastDate = profile.lastActiveDate;

        if (lastDate === today) return profile.streak;

        let newStreak = profile.streak;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastDate === yesterdayStr) {
            newStreak += 1;
        } else {
            newStreak = 1; // Reset or start new
        }

        await db.saveProfile({ ...profile, streak: newStreak, lastActiveDate: today });
        return newStreak;
    },

    // --- Auth ---
    setLoggedIn: async (isLoggedIn: boolean) => {
        try {
            if (isLoggedIn) {
                await db.updateStreak(); // Update streak on login
            }
            await AsyncStorage.setItem(KEYS.IS_LOGGED_IN, isLoggedIn.toString());
        } catch (e) {
            console.error('Failed to set login status', e);
        }
    },

    isLoggedIn: async (): Promise<boolean> => {
        try {
            const val = await AsyncStorage.getItem(KEYS.IS_LOGGED_IN);
            return val === 'true';
        } catch (e) {
            return false;
        }
    },

    clearAll: async () => {
        try {
            await AsyncStorage.clear();
        } catch (e) { }
    }
};
