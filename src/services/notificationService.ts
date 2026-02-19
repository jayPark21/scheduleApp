import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { Event } from '../types';
import { format, isSameDay, addDays, subDays, subHours, isAfter, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export const notificationService = {
    registerForPushNotificationsAsync: async () => {
        try {
            if (Platform.OS === 'android') {
                await Notifications.setNotificationChannelAsync('default', {
                    name: 'default',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#FF231F7C',
                });
            }

            if (Device.isDevice) {
                const { status: existingStatus } = await Notifications.getPermissionsAsync();
                let finalStatus = existingStatus;
                if (existingStatus !== 'granted') {
                    const { status } = await Notifications.requestPermissionsAsync();
                    finalStatus = status;
                }
                if (finalStatus !== 'granted') {
                    return false;
                }
                return true;
            } else {
                console.log('Must use physical device for Push Notifications');
                return false;
            }
        } catch (error) {
            console.warn('Notification permission error (likely Expo Go limitation):', error);
            // In Expo Go, strictly local notifications often work even if this fails or warns
            return true;
        }
    },

    /**
     * Resync all notifications (Daily Briefings + Event Alarms)
     */
    resyncAllNotifications: async (events: Event[]) => {
        try {
            // 1. Cancel all existing notifications
            await Notifications.cancelAllScheduledNotificationsAsync();

            // 2. Schedule Daily Briefings
            await notificationService.scheduleDailyBriefings(events, false); // Pass false to not cancel inside

            // 3. Schedule Individual Event Alarms (1 day before, 2 hours before)
            await notificationService.scheduleAllEventAlarms(events);

            console.log('Notifications resynced');
        } catch (error) {
            console.error('Error resyncing notifications:', error);
        }
    },

    scheduleDailyBriefings: async (events: Event[], cancelExisting = true) => {
        if (cancelExisting) {
            await Notifications.cancelAllScheduledNotificationsAsync();
        }

        // Schedule for today (if not passed) and next 7 days
        const now = new Date();
        const notificationHour = 9; // 9 AM
        const notificationMinute = 0;

        for (let i = 0; i < 7; i++) {
            const targetDate = addDays(now, i);
            const targetLimit = new Date(targetDate);
            targetLimit.setHours(notificationHour, notificationMinute, 0, 0);

            // If today and time passed, skip
            if (i === 0 && now > targetLimit) continue;

            const dateStr = targetDate.toISOString().split('T')[0];
            const dayEvents = events.filter(e => e.date === dateStr && !e.completed);

            if (dayEvents.length > 0) {
                const title = `📅 ${format(targetDate, 'M월 d일', { locale: ko })}의 일정`;
                const firstEvent = dayEvents[0];
                const count = dayEvents.length - 1;
                const body = count > 0
                    ? `${firstEvent.title} 외 ${count}건의 할 일이 있습니다.`
                    : `${firstEvent.title}`;

                const triggerDate = new Date(targetDate);
                triggerDate.setHours(notificationHour, notificationMinute, 0, 0);

                if (triggerDate <= now) continue;

                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: title,
                        body: body,
                        data: { screen: 'Dashboard' },
                    },
                    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate },
                });
            }
        }
    },

    scheduleAllEventAlarms: async (events: Event[]) => {
        const now = new Date();
        // Only consider incomplete events in the future (or near future)
        const futureEvents = events.filter(e => !e.completed);

        for (const event of futureEvents) {
            await notificationService.scheduleSingleEventAlarms(event, now);
        }
    },

    scheduleSingleEventAlarms: async (event: Event, now: Date) => {
        // Construct event start time
        // If startTime is missing, assume 09:00 AM of that day
        const eventDate = parseISO(event.date);
        const [hours, minutes] = (event.startTime || '09:00').split(':').map(Number);
        const eventStart = new Date(eventDate);
        eventStart.setHours(hours, minutes, 0, 0);

        // 1. One day before
        const oneDayBefore = subDays(eventStart, 1);
        if (isAfter(oneDayBefore, now)) {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: `⏰ 내일 일정 알림`,
                    body: `내일 [${event.startTime || '종일'}] "${event.title}" 일정이 있습니다.`,
                    data: { screen: 'Dashboard', eventId: event.id },
                },
                trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: oneDayBefore },
            });
        }

        // 2. Two hours before
        const twoHoursBefore = subHours(eventStart, 2);
        if (isAfter(twoHoursBefore, now)) {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: `🔔일정 시작 2시간 전`,
                    body: `잠시 후 [${event.startTime || '종일'}] "${event.title}" 일정이 시작됩니다.`,
                    data: { screen: 'Dashboard', eventId: event.id },
                },
                trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: twoHoursBefore },
            });
        }
    },

    sendTestNotification: async (events: Event[]) => {
        const today = new Date().toISOString().split('T')[0];
        const dayEvents = events.filter(e => e.date === today && !e.completed);

        const title = "🔔 오늘의 일정 브리핑";
        const body = dayEvents.length > 0
            ? `${dayEvents[0].title} 외 ${dayEvents.length - 1}건의 할 일이 남았습니다.`
            : "오늘 예정된 할 일이 없습니다.";

        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
            },
            trigger: null, // Immediate
        });
    }
};
