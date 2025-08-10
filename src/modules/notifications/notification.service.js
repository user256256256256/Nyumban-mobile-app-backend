import prisma from '../../prisma-client.js';
import { notificationQueue } from '../../queues/notification.queue.js';
import { v4 as uuidv4 } from 'uuid';
import {
  ValidationError,
  NotFoundError,
  ServerError,
} from '../../common/services/errors-builder.service.js';

/**
 * Get user notification preferences
 */
export const getUserNotificationSettings = async (userId) => {
  const prefs = await prisma.user_notification_preferences.findUnique({
    where: { user_id: userId },
    select: {
      notify_nyumban_updates: true,
      notify_payment_sms: true,
    },
  });

  if (!prefs) throw new NotFoundError('Notification preferences for User not found', { field: 'User ID'});
  return prefs;
};

/**
 * Update user notification preferences
 */
export const updateUserNotificationSettings = async (userId, updates) => {
  const existing = await prisma.user_notification_preferences.findUnique({ where: { user_id: userId } });
  if (!existing) throw new NotFoundError('Notification preferences not found');

  return prisma.user_notification_preferences.update({
    where: { user_id: userId },
    data: updates,
  });
};

/**
 * Trigger a notification (pushed to queue for async processing with retries)
 */
export const triggerNotification = async (userId, type, title, body, sendSms = false, sendEmail = false) => {
  const timestamp = new Date();

  const userExists = await prisma.users.findUnique({ where: { id: userId } });
  if (!userExists) {
    throw new NotFoundError(`User with id ${userId} does not exist`, { field: 'User ID' });
  }

  const notification = await prisma.notifications.create({
    data: {
      id: uuidv4(),
      user_id: userId,
      type,
      title,
      body,
      sent_at: timestamp,
    },
  });

  await notificationQueue.add(
    'sendNotification',
    { userId, type, title, body, sendSms, sendEmail },
    {
      attempts: 5,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: true,
      removeOnFail: false,
    }
  );

  return notification;
};

/**
 * Get user notifications
 */
export const getUserNotifications = async (userId, filter, cursor, limit = 20) => {
  const where = { user_id: userId, is_deleted: false };
  if (filter === 'unread') where.is_read = false;

  const queryOptions = {
    where,
    orderBy: { sent_at: 'desc' },
    take: limit,
  };

  if (cursor) {
    // cursor should be an object with unique field, e.g., id or sent_at + id
    queryOptions.cursor = { id: cursor };
    queryOptions.skip = 1; // skip the cursor itself
  }

  const notifications = await prisma.notifications.findMany(queryOptions);

  const unread_count = await prisma.notifications.count({
    where: { user_id: userId, is_deleted: false, is_read: false },
  });

  return { notifications, unread_count };
};


/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (userId) => {
  const result = await prisma.notifications.updateMany({
    where: { user_id: userId, is_deleted: false, is_read: false },
    data: { is_read: true, read_at: new Date() },
  });

  return { notifications: result, unread_count: 0 };
};

/**
 * Clear all notifications
 */
export const clearAllNotifications = async (userId) => {
  await prisma.notifications.updateMany({
    where: { user_id: userId, is_deleted: false },
    data: { is_deleted: true, deleted_at: new Date() },
  });
};

/**
 * Search notifications
 */
export const searchNotifications = async (userId, query) => {
  const notifications = await prisma.notifications.findMany({
    where: {
      user_id: userId,
      is_deleted: false,
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { body: { contains: query, mode: 'insensitive' } },
      ],
    },
    orderBy: { sent_at: 'desc' },
  });

  const unread_count = await prisma.notifications.count({
    where: { user_id: userId, is_deleted: false, is_read: false },
  });

  return { notifications, unread_count };
};

/**
 * Mark specific notifications as read
 */
export const markAsRead = async (userId, ids = null) => {
  const where = {
    user_id: userId,
    is_read: false,
    is_deleted: false,
    ...(ids ? { id: { in: ids } } : {}),
  };

  const updated = await prisma.notifications.updateMany({
    where,
    data: { is_read: true, read_at: new Date() },
  });

  const unread_count = await prisma.notifications.count({
    where: { user_id: userId, is_deleted: false, is_read: false },
  });

  return { updated: updated.count, unread_count };
};

/**
 * Clear specific notifications
 */
export const clearNotifications = async (userId, ids = null) => {
  const where = {
    user_id: userId,
    is_deleted: false,
    ...(ids ? { id: { in: ids } } : {}),
  };

  const result = await prisma.notifications.updateMany({
    where,
    data: { is_deleted: true, deleted_at: new Date() },
  });

  return { cleared: result.count };
};

export default {
  getUserNotificationSettings,
  updateUserNotificationSettings,
  triggerNotification,
  getUserNotifications,
  markAllAsRead,
  clearAllNotifications,
  searchNotifications,
  markAsRead,
  clearNotifications,
};
