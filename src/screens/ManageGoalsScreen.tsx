import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SHADOWS } from '../constants/theme';
import { X, Check, Trash2, Plus } from 'lucide-react-native';
import { db } from '../services/dbService';
import { Goal } from '../types';
import { useFocusEffect } from '@react-navigation/native';

interface ManageGoalsScreenProps {
    navigation: any;
}

const COLORS_PALETTE = [
    '#EF4444', // Red
    '#F97316', // Orange
    '#FACC15', // Yellow
    '#22C55E', // Green
    '#38BDF8', // Sky
    '#0EA5E9', // Blue
    '#6366f1', // Indigo
    '#A855F7', // Purple
    '#EC4899', // Pink
    '#14B8A6', // Teal
];

const ManageGoalsScreen: React.FC<ManageGoalsScreenProps> = ({ navigation }) => {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [newTitle, setNewTitle] = useState('');
    const [selectedColor, setSelectedColor] = useState(COLORS_PALETTE[4]);
    const [isAdding, setIsAdding] = useState(false);
    const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

    const loadGoals = async () => {
        const loaded = await db.getGoals();
        setGoals(loaded);
    };

    useFocusEffect(
        React.useCallback(() => {
            loadGoals();
        }, [])
    );

    const handleAddGoal = async () => {
        if (!newTitle.trim()) {
            Alert.alert('오류', '목표 이름을 입력해주세요.');
            return;
        }
        const newGoal: Goal = {
            id: Math.random().toString(36).substr(2, 9),
            title: newTitle,
            color: selectedColor
        };
        const updatedGoals = [...goals, newGoal];
        await db.saveGoals(updatedGoals);
        setNewTitle('');
        setIsAdding(false);
        loadGoals();
    };

    const handleStartEdit = (goal: Goal) => {
        setEditingGoalId(goal.id);
        setNewTitle(goal.title);
        setSelectedColor(goal.color);
        setIsAdding(true);
    };

    const handleUpdateGoal = async () => {
        if (!newTitle.trim() || !editingGoalId) return;

        const updatedGoals = goals.map(g =>
            g.id === editingGoalId ? { ...g, title: newTitle, color: selectedColor } : g
        );

        await db.saveGoals(updatedGoals);
        setEditingGoalId(null);
        setNewTitle('');
        setIsAdding(false);
        loadGoals();
    };

    const handleDeleteGoal = async (id: string) => {
        Alert.alert('삭제 확인', '이 목표를 삭제하시겠습니까? 관련 일정이 분류되지 않은 상태가 될 수 있습니다.', [
            { text: '취소', style: 'cancel' },
            {
                text: '삭제',
                style: 'destructive',
                onPress: async () => {
                    // 1. Filter out the goal from the goals list
                    const updatedGoals = goals.filter(g => g.id !== id);
                    await db.saveGoals(updatedGoals);

                    // 2. Clear goalId from events that were using this goal
                    const allEvents = await db.getEvents();
                    const updatedEvents = allEvents.map(event =>
                        event.goalId === id ? { ...event, goalId: undefined } : event
                    );
                    await db.saveEvents(updatedEvents);

                    // 3. Reset UI state if we were editing this goal
                    if (editingGoalId === id) {
                        setEditingGoalId(null);
                        setNewTitle('');
                        setIsAdding(false);
                    }

                    loadGoals();
                }
            }
        ]);
    };

    const handleCancel = () => {
        setIsAdding(false);
        setEditingGoalId(null);
        setNewTitle('');
        setSelectedColor(COLORS_PALETTE[4]);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
                    <X size={24} color={COLORS.text[100]} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>목표 관리</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {!isAdding && (
                    <TouchableOpacity style={styles.addButton} onPress={() => setIsAdding(true)}>
                        <Plus size={20} color={COLORS.white} />
                        <Text style={styles.addButtonText}>새 목표 추가하기</Text>
                    </TouchableOpacity>
                )}

                {isAdding && (
                    <View style={styles.addCard}>
                        <Text style={styles.label}>{editingGoalId ? '목표 수정' : '새 목표 이름'}</Text>
                        <TextInput
                            style={styles.input}
                            value={newTitle}
                            onChangeText={setNewTitle}
                            placeholder="예: 독서, 코딩테스트"
                            placeholderTextColor={COLORS.text[500]}
                            autoFocus
                        />

                        <Text style={styles.label}>색상 선택</Text>
                        <View style={styles.colorGrid}>
                            {COLORS_PALETTE.map(c => (
                                <TouchableOpacity
                                    key={c}
                                    style={[styles.colorCircle, { backgroundColor: c }, selectedColor === c && styles.colorSelected]}
                                    onPress={() => setSelectedColor(c)}
                                >
                                    {selectedColor === c && <Check size={14} color="white" />}
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.addActions}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
                                <Text style={styles.cancelText}>취소</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.confirmBtn}
                                onPress={editingGoalId ? handleUpdateGoal : handleAddGoal}
                            >
                                <Text style={styles.confirmText}>{editingGoalId ? '수정 완료' : '추가'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                <View style={styles.list}>
                    {goals.map(goal => (
                        <View key={goal.id} style={[styles.item, { borderLeftColor: goal.color }]}>
                            <TouchableOpacity
                                style={{ flex: 1 }}
                                onPress={() => handleStartEdit(goal)}
                            >
                                <Text style={[styles.itemTitle, { color: goal.color }]}>{goal.title}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={{ padding: 8 }}
                                onPress={() => handleDeleteGoal(goal.id)}
                            >
                                <Trash2 size={18} color={COLORS.text[500]} />
                            </TouchableOpacity>
                        </View>
                    ))}
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
    content: {
        padding: 24,
    },
    addButton: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 16,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderStyle: 'dashed',
    },
    addButtonText: {
        color: COLORS.white,
        fontWeight: '600',
    },
    addCard: {
        backgroundColor: COLORS.background,
        padding: 20,
        borderRadius: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    label: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.text[300],
        marginBottom: 8,
        marginTop: 8,
    },
    input: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: 12,
        color: COLORS.white,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    colorGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginTop: 8,
    },
    colorCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    colorSelected: {
        borderWidth: 2,
        borderColor: 'white',
    },
    addActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24,
    },
    cancelBtn: {
        flex: 1,
        padding: 12,
        alignItems: 'center',
    },
    cancelText: {
        color: COLORS.text[500],
        fontWeight: '600',
    },
    confirmBtn: {
        flex: 1,
        backgroundColor: COLORS.primary[500],
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    confirmText: {
        color: COLORS.white,
        fontWeight: '700',
    },
    list: {
        gap: 12,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.background,
        padding: 16,
        borderRadius: 16,
        borderLeftWidth: 4,
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
});

export default ManageGoalsScreen;
