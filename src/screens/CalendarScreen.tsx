import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, FlatList, Text, TouchableOpacity, SectionList, PanResponder, PanResponderInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, WeekCalendar, LocaleConfig } from 'react-native-calendars';
// Removed unstable libraries: gesture-handler, reanimated
import { COLORS, SHADOWS } from '../constants/theme';
import { useFocusEffect } from '@react-navigation/native';
import { db } from '../services/dbService';
import { Event, Goal } from '../types';
import EventItem from '../components/EventItem';

import { addDays, format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Alert } from 'react-native';

LocaleConfig.locales['ko'] = {
    monthNames: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
    monthNamesShort: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
    dayNames: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
    dayNamesShort: ['일', '월', '화', '수', '목', '금', '토'],
    today: '오늘'
};
LocaleConfig.defaultLocale = 'ko';

interface CalendarScreenProps {
    navigation: any;
}

const CalendarScreen: React.FC<CalendarScreenProps> = ({ navigation }) => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [events, setEvents] = useState<Event[]>([]);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [sections, setSections] = useState<{ title: string, dateString: string, data: Event[] }[]>([]);
    const [markedDates, setMarkedDates] = useState<any>({});
    const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

    const loadData = useCallback(async () => {
        const allEvents = await db.getEvents();
        const allGoals = await db.getGoals();
        setEvents(allEvents);
        setGoals(allGoals);
        updateEventsForDate(selectedDate, allEvents);
        updateMarkedDates(allEvents, allGoals);
    }, [selectedDate]);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    const updateEventsForDate = (startDate: string, allEvents: Event[]) => {
        const newSections = [];
        for (let i = 0; i < 7; i++) {
            const dateObj = addDays(new Date(startDate), i);
            const dateStr = dateObj.toISOString().split('T')[0];
            const displayDate = format(dateObj, 'M월 d일 EEEE', { locale: ko });

            const dayEvents = allEvents
                .filter(e => e.date === dateStr)
                .sort((a, b) => (a.startTime || '23:59').localeCompare(b.startTime || '23:59'));

            // Show section even if empty? Ideally yes, so user can add events to empty future days easily
            // But usually empty sections take up space. Let's show all 7 days so users can see "free days".
            newSections.push({
                title: displayDate,
                dateString: dateStr,
                data: dayEvents,
            });
        }
        setSections(newSections);
    };

    const updateMarkedDates = (allEvents: Event[], allGoals: Goal[]) => {
        const marks: any = {};

        // Group events by date
        const eventsByDate: Record<string, Event[]> = {};
        allEvents.forEach(e => {
            if (!eventsByDate[e.date]) eventsByDate[e.date] = [];
            eventsByDate[e.date].push(e);
        });

        Object.keys(eventsByDate).forEach(date => {
            const dateEvents = eventsByDate[date];
            // Get unique goals for dots
            const uniqueGoalIds = Array.from(new Set(dateEvents.map(e => e.goalId)));
            const dots = uniqueGoalIds.map(gid => {
                const goal = allGoals.find(g => g.id === gid);
                return { key: gid, color: goal?.color || COLORS.text[500] };
            });

            marks[date] = { dots: dots };
        });

        // Highlight selected date
        marks[selectedDate] = {
            ...(marks[selectedDate] || {}),
            selected: true,
            selectedColor: COLORS.primary[500]
        };
        setMarkedDates(marks);
    };

    const getGoalInfo = (goalId: string) => {
        return goals.find(g => g.id === goalId) || { title: '기타', color: COLORS.text[500] };
    };

    const handleToggleComplete = async (id: string) => {
        const updatedEvents = events.map(e => e.id === id ? { ...e, completed: !e.completed } : e);
        await db.saveEvents(updatedEvents);
        loadData();
    };

    const handleDelete = async (id: string) => {
        Alert.alert(
            "일정 삭제",
            "정말로 삭제하시겠습니까?",
            [
                { text: "취소", style: "cancel" },
                {
                    text: "삭제",
                    style: "destructive",
                    onPress: async () => {
                        const updatedEvents = events.filter(e => e.id !== id);
                        await db.saveEvents(updatedEvents);
                        loadData();
                    }
                }
            ]
        );
    };

    const handlePostpone = async (id: string) => {
        const targetEvent = events.find(e => e.id === id);
        if (!targetEvent) return;

        const nextDay = addDays(new Date(targetEvent.date), 1).toISOString().split('T')[0];

        const updatedEvents = events.map(e =>
            e.id === id ? { ...e, date: nextDay } : e
        );

        await db.saveEvents(updatedEvents);
        Alert.alert("미루기 완료", "일정이 내일로 이동되었습니다. 😅");
        loadData();
    };

    useEffect(() => {
        updateEventsForDate(selectedDate, events);
        updateMarkedDates(events, goals);
    }, [selectedDate, events, goals]);

    const onDayPress = (day: any) => {
        setSelectedDate(day.dateString);
    };

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gestureState) => {
                // Activate only on vertical swipes exceeding a threshold
                return Math.abs(gestureState.dy) > 20 && Math.abs(gestureState.dx) < 20;
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy < -50) {
                    // Swipe Up -> Week View
                    setViewMode('week');
                } else if (gestureState.dy > 50) {
                    // Swipe Down -> Month View
                    setViewMode('month');
                }
            }
        })
    ).current;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Gesture Container */}
            <View {...panResponder.panHandlers}>
                {viewMode === 'month' ? (
                    <Calendar
                        current={selectedDate}
                        onDayPress={onDayPress}
                        markingType={'multi-dot'}
                        markedDates={markedDates}
                        theme={{
                            backgroundColor: COLORS.surface,
                            calendarBackground: COLORS.surface,
                            selectedDayBackgroundColor: COLORS.primary[500],
                            todayTextColor: COLORS.primary[400],
                            dayTextColor: COLORS.text[100],
                            textDisabledColor: COLORS.text[700],
                            monthTextColor: COLORS.white,
                            arrowColor: COLORS.primary[500],
                            dotColor: COLORS.primary[500],
                            textDayFontWeight: '600',
                            textMonthFontWeight: 'bold',
                            textDayHeaderFontWeight: '600',
                        }}
                        style={styles.calendar}
                    />
                ) : (
                    <WeekCalendar
                        current={selectedDate}
                        date={selectedDate}
                        onDayPress={onDayPress}
                        markingType={'multi-dot'}
                        markedDates={markedDates}
                        theme={{
                            backgroundColor: COLORS.surface,
                            calendarBackground: COLORS.surface,
                            selectedDayBackgroundColor: COLORS.primary[500],
                            todayTextColor: COLORS.primary[400],
                            dayTextColor: COLORS.text[100],
                            textDisabledColor: COLORS.text[700],
                            monthTextColor: COLORS.white,
                            arrowColor: COLORS.primary[500],
                            dotColor: COLORS.primary[500],
                            textDayFontWeight: '600',
                            textMonthFontWeight: 'bold',
                            textDayHeaderFontWeight: '600',
                        }}
                        style={styles.calendar}
                    />
                )}
                {/* Drag Handle Indicator */}
                <View style={{ alignItems: 'center', paddingBottom: 10, paddingTop: 5 }}>
                    <View style={{ width: 40, height: 4, backgroundColor: COLORS.text[700], borderRadius: 2 }} />
                </View>
            </View>

            <View style={styles.listContainer}>
                <SectionList
                    sections={sections}
                    keyExtractor={(item, index) => item.id + index}
                    contentContainerStyle={styles.listContent}
                    stickySectionHeadersEnabled={false}
                    renderSectionHeader={({ section: { title, dateString } }) => (
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 10 }}>
                            <Text style={styles.dateTitle}>{title}</Text>
                            <TouchableOpacity
                                onPress={() => navigation.navigate('AddEvent', { initialDate: dateString })}
                                style={{ padding: 8 }}
                            >
                                <Text style={{ color: COLORS.primary[400], fontSize: 24 }}>+</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    renderItem={({ item }) => {
                        const goal = getGoalInfo(item.goalId);
                        return (
                            <EventItem
                                event={item}
                                goalTitle={goal.title}
                                goalColor={goal.color}
                                onToggleComplete={handleToggleComplete}
                                onDelete={handleDelete}
                                onPostpone={handlePostpone}
                                onPress={(event) => navigation.navigate('AddEvent', { event })}
                            />
                        );
                    }}
                    ListEmptyComponent={<Text style={styles.emptyText}>일정이 없습니다.</Text>}
                />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    calendar: {
        marginBottom: 10,
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        ...SHADOWS.small,
    },
    listContainer: {
        flex: 1,
        padding: 20,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.white,
        marginBottom: 12,
    },
    dateTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.white,
    },
    listContent: {
        paddingBottom: 20
    },
    emptyText: {
        color: COLORS.text[300],
        textAlign: 'center',
        marginTop: 20,
    },
});

export default CalendarScreen;
