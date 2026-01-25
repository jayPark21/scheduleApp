import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SHADOWS } from '../constants/theme';
import { Event } from '../types';
import { CheckCircle, Circle, Trash2, Clock, CalendarArrowDown } from 'lucide-react-native';

interface EventItemProps {
    event: Event;
    goalTitle: string;
    goalColor: string;
    onToggleComplete: (id: string) => void;
    onDelete: (id: string) => void;
    onPostpone: (id: string) => void;
    onPress?: (event: Event) => void;
}

const EventItem: React.FC<EventItemProps> = ({
    event,
    goalTitle,
    goalColor,
    onToggleComplete,
    onDelete,
    onPostpone,
    onPress
}) => {
    return (
        <View style={[styles.container, { borderLeftColor: goalColor, borderLeftWidth: 4 }]}>
            <TouchableOpacity
                style={styles.checkButton}
                onPress={() => onToggleComplete(event.id)}
            >
                {event.completed ? (
                    <CheckCircle size={24} color={goalColor} />
                ) : (
                    <Circle size={24} color={COLORS.text[500]} />
                )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.content} onPress={() => onPress && onPress(event)}>
                <View style={styles.header}>
                    <Text style={[
                        styles.title,
                        event.completed && styles.completedTitle
                    ]}>
                        {event.title}
                    </Text>
                </View>

                <View style={styles.metaContainer}>
                    {event.startTime && (
                        <View style={styles.metaItem}>
                            <Clock size={12} color={COLORS.text[500]} />
                            <Text style={styles.metaText}>{event.startTime}</Text>
                        </View>
                    )}
                    <View style={[styles.badge, { backgroundColor: goalColor + '20' }]}>
                        <Text style={[styles.badgeText, { color: goalColor }]}>{goalTitle}</Text>
                    </View>
                </View>
            </TouchableOpacity>

            <View style={styles.actions}>
                {!event.completed && (
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => onPostpone(event.id)}
                    >
                        <CalendarArrowDown size={18} color={COLORS.text[500]} />
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => onDelete(event.id)}
                >
                    <Trash2 size={18} color={COLORS.danger[500]} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        padding: 16,
        borderRadius: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    checkButton: {
        marginRight: 12,
    },
    content: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.white,
        marginRight: 8,
    },
    completedTitle: {
        color: COLORS.text[500],
        textDecorationLine: 'line-through',
    },
    metaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 12,
        color: COLORS.text[500],
        fontWeight: '500',
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '700',
    },
    actions: {
        flexDirection: 'row',
        gap: 4,
    },
    actionButton: {
        padding: 8,
    },
});

export default EventItem;
