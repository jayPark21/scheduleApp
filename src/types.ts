export interface Goal {
    id: string;
    title: string;
    color: string; // Hex code
}

export interface Event {
    id: string;
    title: string;
    date: string;       // YYYY-MM-DD
    startTime?: string; // HH:mm (Optional now, for flexible tasks)
    endTime?: string;   // HH:mm
    goalId: string;     // Links to Goal
    description?: string;
    completed: boolean;
    isRoutine?: boolean; // New: For repeated tasks
}

export interface UserProfile {
    name: string;
    avatar: string;
    role: string;
    dailyGoalHours: number;
    level: number;
    xp: number;
    streak: number;
    lastActiveDate?: string; // YYYY-MM-DD
}

export const DEFAULT_GOALS: Goal[] = [
    { id: 'g1', title: '개인', color: '#38BDF8' }, // Sky Blue
    { id: 'g2', title: '업무', color: '#A855F7' }, // Purple
    { id: 'g3', title: '운동', color: '#22C55E' }, // Green
    { id: 'g4', title: '루틴', color: '#FACC15' }, // Yellow
];
