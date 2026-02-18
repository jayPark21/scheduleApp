import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Flame, Star, Trophy } from 'lucide-react-native';
import { COLORS, GRADIENTS, SHADOWS } from '../constants/theme';
import { UserProfile } from '../types';

const { width } = Dimensions.get('window');

interface LevelStatusProps {
    profile: UserProfile;
}

export const LevelStatus: React.FC<LevelStatusProps> = ({ profile }) => {
    // level * 100 XP needed for next level
    const nextLevelXp = profile.level * 100;
    const progress = Math.min(profile.xp / nextLevelXp, 1);

    return (
        <LinearGradient
            colors={GRADIENTS.dark}
            style={styles.container}
        >
            <View style={styles.header}>
                <View style={styles.levelBadge}>
                    <Star size={16} color={COLORS.accent.yellow} fill={COLORS.accent.yellow} />
                    <Text style={styles.levelText}>Lv. {profile.level}</Text>
                </View>

                <View style={styles.streakInfo}>
                    <Flame size={18} color={profile.streak > 0 ? '#FF7E33' : COLORS.text[500]} />
                    <Text style={[styles.streakText, profile.streak > 0 && styles.activeStreak]}>
                        {profile.streak} DAY STREAK
                    </Text>
                </View>
            </View>

            <View style={styles.xpContainer}>
                <View style={styles.xpHeader}>
                    <Text style={styles.xpLabel}>SOLO CEO EXPERIENCE</Text>
                    <Text style={styles.xpValue}>{profile.xp} / {nextLevelXp} XP</Text>
                </View>

                <View style={styles.progressBarBg}>
                    <LinearGradient
                        colors={GRADIENTS.primary}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.progressBarFill, { width: `${progress * 100}%` }]}
                    />
                </View>
            </View>

            <View style={styles.footer}>
                <Text style={styles.roleText}>{profile.role}</Text>
                <Trophy size={14} color={COLORS.text[300]} />
            </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 20,
        marginTop: 20,
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        ...SHADOWS.medium,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    levelBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(250, 204, 21, 0.15)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    levelText: {
        color: COLORS.accent.yellow,
        fontSize: 14,
        fontWeight: '800',
        marginLeft: 6,
    },
    streakInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    streakText: {
        color: COLORS.text[500],
        fontSize: 12,
        fontWeight: '700',
        marginLeft: 6,
    },
    activeStreak: {
        color: '#FF7E33',
    },
    xpContainer: {
        marginBottom: 10,
    },
    xpHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 8,
    },
    xpLabel: {
        color: COLORS.text[300],
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1,
    },
    xpValue: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: '600',
    },
    progressBarBg: {
        height: 8,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
    },
    roleText: {
        color: COLORS.text[300],
        fontSize: 12,
        fontWeight: '500',
    }
});
