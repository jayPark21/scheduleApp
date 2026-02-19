import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert, SectionList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Plus, Flame } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SHADOWS, GRADIENTS } from '../constants/theme';
import { db } from '../services/dbService';
import { Event, UserProfile, Goal } from '../types';
import EventItem from '../components/EventItem';
import { LevelStatus } from '../components/LevelStatus';
import { format, addDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import { notificationService } from '../services/notificationService';

interface DashboardScreenProps {
    navigation: any;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
    const [sections, setSections] = useState<{ title: string, color: string, data: Event[] }[]>([]);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = useCallback(async () => {
        const loadedEvents = await db.getEvents();
        const loadedGoals = await db.getGoals();
        const loadedProfile = await db.getProfile();

        if (!loadedProfile) {
            const defaultProfile: UserProfile = {
                name: 'User',
                role: 'Solo CEO',
                avatar: '',
                dailyGoalHours: 4,
                level: 1,
                xp: 0,
                streak: 0
            };
            await db.saveProfile(defaultProfile);
            setProfile(defaultProfile);
        } else {
            // Ensure all properties exist (migration)
            const migratedProfile = {
                ...loadedProfile,
                level: loadedProfile.level || 1,
                xp: loadedProfile.xp || 0,
                streak: loadedProfile.streak || 0
            };
            if (JSON.stringify(migratedProfile) !== JSON.stringify(loadedProfile)) {
                await db.saveProfile(migratedProfile);
            }
            setProfile(migratedProfile);
        }

        const today = new Date().toISOString().split('T')[0];
        const todayEvents = loadedEvents.filter(e => e.date === today);

        // Group by Goal
        const goalMap = new Map<string, Goal>();
        loadedGoals.forEach(g => goalMap.set(g.id, g));

        const grouped: Record<string, Event[]> = {};
        // Initialize groups based on goal order
        loadedGoals.forEach(g => grouped[g.id] = []);
        // Also handle events with unknown goals
        grouped['unknown'] = [];

        todayEvents.forEach(e => {
            const gid = e.goalId || 'unknown';
            if (grouped[gid]) grouped[gid].push(e);
            else grouped['unknown'].push(e);
        });

        const newSections = [];
        for (const goal of loadedGoals) {
            const goalEvents = grouped[goal.id];
            // Only show goals that have events for today
            if (goalEvents && goalEvents.length > 0) {
                newSections.push({
                    goalId: goal.id,
                    title: goal.title,
                    color: goal.color,
                    data: goalEvents.sort((a, b) => (a.startTime || '23:59').localeCompare(b.startTime || '23:59'))
                });
            }
        }
        if (grouped['unknown'].length > 0) {
            newSections.push({
                goalId: '',
                title: '기타',
                color: COLORS.text[500],
                data: grouped['unknown']
            });
        }

        setSections(newSections);
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const handleToggleComplete = async (id: string) => {
        const allEvents = await db.getEvents();
        const targetEvent = allEvents.find(e => e.id === id);
        if (!targetEvent) return;

        const isCompleting = !targetEvent.completed;
        const updatedEvents = allEvents.map(e => e.id === id ? { ...e, completed: isCompleting } : e);
        await db.saveEvents(updatedEvents);
        await notificationService.resyncAllNotifications(updatedEvents);

        if (isCompleting) {
            const { leveledUp, newLevel } = await db.addXP(20); // 20 XP per task
            if (leveledUp) {
                Alert.alert("LEVEL UP! 🎊", `축하합니다 대표님! 레벨 ${newLevel}이 되셨습니다! 더 높은 곳으로 가시죠! 🚀`);
            }
        } else {
            await db.addXP(-20); // Reverse XP if unchecked
        }

        loadData();
    };

    const handleDelete = async (id: string) => {
        const allEvents = await db.getEvents();
        const updatedEvents = allEvents.filter(e => e.id !== id);
        await db.saveEvents(updatedEvents);
        await notificationService.resyncAllNotifications(updatedEvents);
        loadData();
    };

    const handlePostpone = async (id: string) => {
        const allEvents = await db.getEvents();
        const targetEvent = allEvents.find(e => e.id === id);
        if (!targetEvent) return;

        const nextDay = addDays(new Date(targetEvent.date), 1).toISOString().split('T')[0];
        const updatedEvents = allEvents.map(e =>
            e.id === id ? { ...e, date: nextDay } : e
        );

        await db.saveEvents(updatedEvents);
        await notificationService.resyncAllNotifications(updatedEvents);
        Alert.alert("미루기 완료", "일정이 내일로 이동되었습니다. 😅");
        loadData();
    };

    const todayDate = format(new Date(), 'M월 d일 EEEE', { locale: ko });

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[COLORS.background, '#1e1b4b']}
                style={StyleSheet.absoluteFillObject}
            />
            <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.dateText}>{todayDate}</Text>
                        <Text style={styles.greeting}>
                            Hello, <Text style={styles.nameHighlight}>{profile?.name || 'User'}</Text>
                        </Text>
                    </View>
                    <View style={styles.headerRight}>
                        <TouchableOpacity
                            style={styles.focusButton}
                            onPress={() => navigation.navigate('Focus')}
                        >
                            <LinearGradient colors={['#FF7E33', '#FF4E00']} style={styles.focusGradient}>
                                <Flame size={20} color={COLORS.white} />
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.profileButton} onPress={() => navigation.navigate('Profile')}>
                            <LinearGradient colors={GRADIENTS.primary} style={styles.avatarGradient}>
                                <Text style={styles.avatarText}>{profile?.name?.[0] || 'U'}</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>

                {profile && <LevelStatus profile={profile} />}

                <SectionList
                    sections={sections}
                    keyExtractor={item => item.id}
                    renderItem={({ item, section }) => (
                        <EventItem
                            event={item}
                            goalTitle={section.title}
                            goalColor={section.color}
                            onToggleComplete={handleToggleComplete}
                            onDelete={handleDelete}
                            onPostpone={handlePostpone}
                            onPress={(event) => navigation.navigate('AddEvent', { event })}
                        />
                    )}
                    renderSectionHeader={({ section }: any) => {
                        const { title, color, goalId } = section;
                        return (
                            <View style={styles.sectionHeaderContainer}>
                                <View style={[styles.sectionHeader, { borderLeftColor: color }]}>
                                    <Text style={[styles.sectionTitle, { color: color }]}>{title}</Text>
                                </View>
                                {goalId ? (
                                    <TouchableOpacity
                                        style={styles.inlineAddButton}
                                        onPress={() => navigation.navigate('AddEvent', { initialGoalId: goalId })}
                                    >
                                        <Plus size={20} color={COLORS.text[500]} />
                                    </TouchableOpacity>
                                ) : null}
                            </View>
                        );
                    }}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>오늘의 할 일이 없어요.</Text>
                            <Text style={styles.emptySubText}>+ 버튼을 눌러 목표를 추가해보세요.</Text>
                        </View>
                    }
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary[500]} />
                    }
                    stickySectionHeadersEnabled={false}
                />

                <TouchableOpacity
                    style={styles.fabWrapper}
                    onPress={() => navigation.navigate('AddEvent')}
                >
                    <LinearGradient
                        colors={GRADIENTS.secondary}
                        style={styles.fab}
                    >
                        <Plus color={COLORS.white} size={28} />
                    </LinearGradient>
                </TouchableOpacity>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        padding: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    focusButton: {
        marginRight: 12,
        ...SHADOWS.glow,
        shadowColor: '#FF7E33',
    },
    focusGradient: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    dateText: {
        fontSize: 14,
        color: COLORS.primary[400],
        fontWeight: '700',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    greeting: {
        fontSize: 28,
        fontWeight: '800',
        color: COLORS.white,
    },
    nameHighlight: {
        color: COLORS.primary[400],
    },
    profileButton: {
        ...SHADOWS.glow,
    },
    avatarGradient: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    avatarText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    listContent: {
        padding: 24,
        paddingTop: 8,
        paddingBottom: 100,
    },
    sectionHeaderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 16,
        marginBottom: 10,
    },
    sectionHeader: {
        paddingLeft: 12,
        borderLeftWidth: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    inlineAddButton: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0.5,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text[300],
        marginBottom: 8,
    },
    emptySubText: {
        fontSize: 14,
        color: COLORS.text[500],
    },
    fabWrapper: {
        position: 'absolute',
        bottom: 100, // Adjusted to sit clearly above the tab bar
        right: 24,
        zIndex: 100,
        ...SHADOWS.glow,
        shadowColor: COLORS.secondary[500],
    },
    fab: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default DashboardScreen;
