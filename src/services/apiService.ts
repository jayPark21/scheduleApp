import { Event } from '../types';

// Mock API service
export const apiService = {
    fetchEvents: async (): Promise<Event[] | null> => {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        // In a real app, this would fetch from a server
        // For now, return null or mock data if needed
        return null;
    },

    pushEvents: async (events: Event[]): Promise<boolean> => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return true;
    }
};
