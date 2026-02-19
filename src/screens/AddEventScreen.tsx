import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SHADOWS } from '../constants/theme';
import { X } from 'lucide-react-native';
import { db } from '../services/dbService';
import { Event, Goal } from '../types';
import { Calendar } from 'react-native-calendars';

import { format, addDays, isBefore } from 'date-fns';
import { notificationService } from '../services/notificationService';

interface AddEventScreenProps {
    navigation: any;
}

const AddEventScreen: React.FC<AddEventScreenProps> = ({ navigation, route }: any) => {
    const [title, setTitle] = useState('');



    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(''); // Optional end date for range
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [selectedGoalId, setSelectedGoalId] = useState<string>('');
    const [goals, setGoals] = useState<Goal[]>([]);

    const [showCalendar, setShowCalendar] = useState(false);
    const [targetDateInput, setTargetDateInput] = useState<'start' | 'end'>('start');

    useEffect(() => {
        const initGoalId = route.params?.initialGoalId;
        const initDate = route.params?.initialDate;
        const editingEvent = route.params?.event;

        if (editingEvent) {
            setTitle(editingEvent.title);
            setStartDate(editingEvent.date);
            setStartTime(editingEvent.startTime || '');
            setEndTime(editingEvent.endTime || '');
            setSelectedGoalId(editingEvent.goalId);
            navigation.setOptions({ headerTitle: '일정 수정' });
        } else {
            if (initGoalId) setSelectedGoalId(initGoalId);
            if (initDate) setStartDate(initDate);
        }

        db.getGoals().then(gs => {
            setGoals(gs);
            if (gs.length > 0 && !selectedGoalId && !initGoalId && !editingEvent) setSelectedGoalId(gs[0].id);
        });
    }, []);

    const handleSave = async () => {
        if (!title.trim()) {
            Alert.alert('오류', '일정 제목을 입력해주세요.');
            return;
        }
        if (!selectedGoalId) {
            Alert.alert('오류', '목표(카테고리)를 선택해주세요.');
            return;
        }

        const currentEvents = await db.getEvents();
        const editingEvent = route.params?.event;

        if (editingEvent) {
            // 1. Update the original single event
            const updatedEvent: Event = {
                ...editingEvent,
                title,
                date: startDate,
                startTime: startTime || undefined,
                endTime: endTime || undefined,
                goalId: selectedGoalId,
            };

            let eventsToSave = currentEvents.map(e => e.id === editingEvent.id ? updatedEvent : e);

            // 2. If endDate is specified, create NEW events for subsequent days
            // Note: This does NOT link them as a series, just creates individual copies.
            if (endDate) {
                if (isBefore(new Date(endDate), new Date(startDate))) {
                    Alert.alert('오류', '종료일은 시작일보다 빠를 수 없습니다.');
                    return;
                }

                let current = addDays(new Date(startDate), 1);
                const end = new Date(endDate);

                let count = 0;
                while (current <= end && count < 365) {
                    eventsToSave.push({
                        id: Math.random().toString(36).substr(2, 9),
                        title,
                        date: current.toISOString().split('T')[0],
                        startTime: startTime || undefined,
                        endTime: endTime || undefined,
                        goalId: selectedGoalId,
                        completed: false,
                        description: '',
                    });
                    current = addDays(current, 1);
                    count++;
                }
            }

            await db.saveEvents(eventsToSave);
            await notificationService.resyncAllNotifications(eventsToSave);
        } else {
            // Creation mode: Support Range
            const newEvents: Event[] = [];

            if (endDate) {
                // Create multiple events
                // Validation
                if (isBefore(new Date(endDate), new Date(startDate))) {
                    Alert.alert('오류', '종료일은 시작일보다 빠를 수 없습니다.');
                    return;
                }

                let current = new Date(startDate);
                const end = new Date(endDate);

                // Safety limit: max 365 days
                let count = 0;
                while (current <= end && count < 365) {
                    newEvents.push({
                        id: Math.random().toString(36).substr(2, 9),
                        title,
                        date: current.toISOString().split('T')[0],
                        startTime: startTime || undefined,
                        endTime: endTime || undefined,
                        goalId: selectedGoalId,
                        completed: false,
                        description: '',
                    });
                    current = addDays(current, 1);
                    count++;
                }

            } else {
                // Single day event
                newEvents.push({
                    id: Math.random().toString(36).substr(2, 9),
                    title,
                    date: startDate,
                    startTime: startTime || undefined,
                    endTime: endTime || undefined,
                    goalId: selectedGoalId,
                    completed: false,
                    description: '',
                });
            }

            const finalEvents = [...currentEvents, ...newEvents];
            await db.saveEvents(finalEvents);
            await notificationService.resyncAllNotifications(finalEvents);
        }

        navigation.goBack();
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header ... */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
                    <X size={24} color={COLORS.text[100]} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{route.params?.event ? '일정 수정' : '새 일정 추가'}</Text>
                <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
                    <Text style={styles.saveButtonText}>완료</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Title & Goal Sections ... */}
                <View style={styles.section}>
                    <Text style={styles.label}>할 일</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="예: 영어 단어 50개 암기"
                        value={title}
                        onChangeText={setTitle}
                        placeholderTextColor={COLORS.text[500]}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>목표 (Goal)</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.goalScroll}>
                        {goals.map((goal) => (
                            <TouchableOpacity
                                key={goal.id}
                                style={[
                                    styles.goalChip,
                                    selectedGoalId === goal.id && { borderColor: goal.color, backgroundColor: goal.color + '20' }
                                ]}
                                onPress={() => setSelectedGoalId(goal.id)}
                            >
                                <View style={[styles.goalDot, { backgroundColor: goal.color }]} />
                                <Text style={[
                                    styles.goalText,
                                    selectedGoalId === goal.id && { color: goal.color, fontWeight: 'bold' }
                                ]}>{goal.title}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                <View style={styles.row}>
                    <View style={[styles.section, { flex: 1, marginRight: 12 }]}>
                        <Text style={styles.label}>시작일 (필수)</Text>
                        <TouchableOpacity
                            onPress={() => {
                                setTargetDateInput('start');
                                setShowCalendar(true);
                            }}
                        >
                            <View pointerEvents="none">
                                <TextInput
                                    style={styles.input}
                                    value={startDate}
                                    placeholder="YYYY-MM-DD"
                                    placeholderTextColor={COLORS.text[500]}
                                    editable={false}
                                />
                            </View>
                        </TouchableOpacity>
                    </View>
                    <View style={[styles.section, { flex: 1 }]}>
                        <Text style={styles.label}>종료일 (선택)</Text>
                        <TouchableOpacity
                            onPress={() => {
                                setTargetDateInput('end');
                                setShowCalendar(true);
                            }}
                        >
                            <View pointerEvents="none">
                                <TextInput
                                    style={styles.input}
                                    value={endDate}
                                    placeholder="반복 종료일"
                                    placeholderTextColor={COLORS.text[500]}
                                    editable={false}
                                />
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ... Time Inputs ... */}

                <Modal
                    visible={showCalendar}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setShowCalendar(false)}
                >
                    <TouchableOpacity
                        style={styles.modalOverlay}
                        activeOpacity={1}
                        onPress={() => setShowCalendar(false)}
                    >
                        <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
                            <Calendar
                                onDayPress={(day: any) => {
                                    if (targetDateInput === 'start') {
                                        setStartDate(day.dateString);
                                    } else {
                                        setEndDate(day.dateString);
                                    }
                                    setShowCalendar(false);
                                }}
                                markedDates={{
                                    [startDate]: { selected: true, selectedColor: COLORS.primary[500] },
                                    [endDate]: { selected: true, selectedColor: COLORS.secondary[500] }
                                }}
                                theme={{
                                    backgroundColor: COLORS.surface,
                                    calendarBackground: COLORS.surface,
                                    textSectionTitleColor: COLORS.text[300],
                                    selectedDayBackgroundColor: COLORS.primary[500],
                                    selectedDayTextColor: '#ffffff',
                                    todayTextColor: COLORS.primary[400],
                                    dayTextColor: COLORS.text[100],
                                    textDisabledColor: COLORS.text[700],
                                    monthTextColor: COLORS.white,
                                    arrowColor: COLORS.primary[400],
                                }}
                            />
                        </View>
                    </TouchableOpacity>
                </Modal>

                <View style={styles.row}>
                    <View style={[styles.section, { flex: 1, marginRight: 12 }]}>
                        <Text style={styles.label}>시작 시간 (선택)</Text>
                        <TextInput
                            style={styles.input}
                            value={startTime}
                            onChangeText={setStartTime}
                            placeholder="09:00"
                            placeholderTextColor={COLORS.text[500]}
                        />
                    </View>
                    <View style={[styles.section, { flex: 1 }]}>
                        <Text style={styles.label}>종료 시간 (선택)</Text>
                        <TextInput
                            style={styles.input}
                            value={endTime}
                            onChangeText={setEndTime}
                            placeholder="10:00"
                            placeholderTextColor={COLORS.text[500]}
                        />
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.surface,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    closeButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.white,
    },
    saveButton: {
        backgroundColor: COLORS.primary[500],
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    saveButtonText: {
        color: COLORS.white,
        fontWeight: '700',
        fontSize: 14,
    },
    content: {
        padding: 24,
    },
    section: {
        marginBottom: 24,
    },
    row: {
        flexDirection: 'row',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text[300],
        marginBottom: 8,
    },
    input: {
        backgroundColor: COLORS.background,
        borderRadius: 16,
        padding: 16,
        fontSize: 16,
        color: COLORS.white,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    goalScroll: {
        flexDirection: 'row',
    },
    goalChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 20,
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        marginRight: 10,
        gap: 8,
    },
    goalDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    goalText: {
        fontSize: 14,
        color: COLORS.text[300],
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 24,
    },
    modalContent: {
        backgroundColor: COLORS.surface,
        borderRadius: 24,
        overflow: 'hidden',
        ...SHADOWS.medium,
    },
});

export default AddEventScreen;
