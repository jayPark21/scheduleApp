export const COLORS = {
    // Deep Space / Future Backgrounds
    background: '#0B0F19', // Very dark blue/black
    surface: '#151C2F',    // Slightly lighter for cards
    surfaceHighlight: '#1F2942',

    // Neon Accents
    primary: {
        50: '#E0F2FE',
        100: '#BAE6FD',
        400: '#38BDF8',
        500: '#0EA5E9', // Sky Blue Neon
        600: '#0284C7',
        900: '#0C4A6E',
        glow: '#38BDF8', // For shadows/glows
    },
    secondary: {
        400: '#C084FC',
        500: '#A855F7', // Purple Neon
        glow: '#A855F7',
    },
    accent: {
        400: '#2DD4BF', // Teal Neon
        500: '#14B8A6',
        yellow: '#FACC15',
    },

    // States
    success: {
        400: '#4ADE80',
        500: '#22C55E', // Green Neon
        bg: 'rgba(34, 197, 94, 0.1)',
    },
    danger: {
        400: '#F87171',
        500: '#EF4444', // Red Neon
    },

    // Text
    text: {
        50: '#F8FAFC', // White
        100: '#E2E8F0', // Off-white
        300: '#94A3B8', // Muted
        500: '#64748B',
        700: '#334155', // Dark (only for light modes if needed)
        800: '#1e293b',
        900: '#0f172a',
    },

    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',
};

export const GRADIENTS = {
    primary: ['#0EA5E9', '#2563EB'] as const, // Cyan to Blue
    secondary: ['#A855F7', '#7C3AED'] as const, // Purple to Violet
    dark: ['#151C2F', '#0B0F19'] as const,     // Card Gradient
    glow: ['rgba(56, 189, 248, 0.5)', 'transparent'] as const,
};

export const SHADOWS = {
    small: {
        shadowColor: "#0EA5E9",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3.84,
        elevation: 2,
    },
    medium: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    large: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    glow: {
        shadowColor: "#0EA5E9",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 10,
        elevation: 10,
    }
};
