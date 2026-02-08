/**
 * Habit Reminder Notifications
 * Schedules daily notifications at user-specified times for each habit
 */

import { Habit } from '@/types/habit';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { addDays, setHours, setMinutes, startOfDay } from 'date-fns';

const HABIT_CHANNEL_ID = 'habit_reminders';

/** Generate a stable notification ID from habit ID + day offset */
const getNotificationId = (habitId: string, dayOffset: number): number => {
  const base = parseInt(habitId.replace(/\D/g, '').slice(0, 7), 10) || Date.now();
  return (base + dayOffset) % 2147483647; // keep within 32-bit int
};

/**
 * Schedule daily habit reminders for the next 14 days
 */
export const scheduleHabitReminder = async (habit: Habit): Promise<number[]> => {
  if (!habit.reminder?.enabled || !habit.reminder.time) return [];
  if (!Capacitor.isNativePlatform()) return [];

  const [hours, minutes] = habit.reminder.time.split(':').map(Number);
  const now = new Date();
  const ids: number[] = [];
  const notifications: any[] = [];

  for (let d = 0; d < 14; d++) {
    const date = addDays(startOfDay(now), d);
    const dayOfWeek = date.getDay();

    // For weekly habits, only schedule on selected days
    if (habit.frequency === 'weekly' && habit.weeklyDays?.length) {
      if (!habit.weeklyDays.includes(dayOfWeek)) continue;
    }

    const scheduleAt = setMinutes(setHours(date, hours), minutes);
    if (scheduleAt <= now) continue;

    const id = getNotificationId(habit.id, d);
    ids.push(id);

    notifications.push({
      id,
      title: `${habit.emoji} Time for: ${habit.name}`,
      body: habit.currentStreak > 0
        ? `Keep your ${habit.currentStreak}-day streak going! 🔥`
        : `Build your habit today!`,
      schedule: { at: scheduleAt, allowWhileIdle: true },
      sound: 'default',
      channelId: HABIT_CHANNEL_ID,
      smallIcon: 'npd_notification_icon',
      extra: { habitId: habit.id, type: 'habit' },
    });
  }

  if (notifications.length > 0) {
    try {
      await LocalNotifications.schedule({ notifications });
    } catch (e) {
      console.error('Failed to schedule habit reminders:', e);
    }
  }

  return ids;
};

/**
 * Cancel all reminders for a habit
 */
export const cancelHabitReminder = async (habit: Habit): Promise<void> => {
  if (!Capacitor.isNativePlatform()) return;
  const ids = habit.reminder?.notificationIds;
  if (!ids?.length) return;

  try {
    await LocalNotifications.cancel({ notifications: ids.map(id => ({ id })) });
  } catch (e) {
    console.error('Failed to cancel habit reminders:', e);
  }
};

/**
 * Reschedule reminders for all habits (e.g., called daily by background scheduler)
 */
export const rescheduleAllHabitReminders = async (habits: Habit[]): Promise<void> => {
  for (const habit of habits) {
    if (habit.isArchived || !habit.reminder?.enabled) continue;
    await cancelHabitReminder(habit);
    const ids = await scheduleHabitReminder(habit);
    // Note: caller should persist updated notificationIds if needed
  }
};
