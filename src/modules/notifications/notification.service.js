import prisma from '../../prisma-client.js';
import { logNotification } from '../../common/utils/notification.logger.js';
import { EmailService } from '../../common/services/email.service.js'
import { SnsService }  from '../../common/services/sns.service.js'
import { sendPushNotification } from '../../common/services/push.service.js'

import { v4 as uuidv4 } from 'uuid';

import {
    ValidationError,
    NotFoundError,
    AuthError,
    ForbiddenError,
    ServerError,
} from '../../common/services/errors.js';

export const getUserNotificationSettings = async (userId) => {
    const prefs = await prisma.user_notification_preferences.findUnique({
        where: {user_id: userId,},
        select: {
            notify_nyumban_updates: true,
            notify_payment_sms: true,
        }
    })

    if (!prefs) throw new NotFoundError('Notification preferences not found');
    
    return  prefs;
}

export const updateUserNotificationSettings = async (userId, updates) => {
    const existing = await prisma.user_notification_preferences.findUnique({ where: {user_id: userId } });
    if (!existing) throw new NotFoundError('Notification preferences not found');

    const updated = await prisma.user_notification_preferences.update({
        where: {user_id: userId},
        data: updates,
    });

    return updated;
}

export const triggerNotification = async (userId, type, title, body, sendSms = false, sendEmail = false) => {
  const timestamp = new Date();

  if (type !== 'user') {
    throw new ValidationError('Invalid notification type for user notifications', { field: 'Notification type' });
  }

  const userExists = await prisma.users.findUnique({ where: { id: userId } });
  if (!userExists) {
    throw new NotFoundError(`User with id ${userId} does not exist`, {field: 'User ID'});
  }

  let notification;

  try {
    notification = await prisma.notifications.create({
      data: {
        id: uuidv4(),  
        user_id: userId,
        type,   
        title,
        body,
        sent_at: timestamp,
      },
    });
  } catch (err) {
    await logNotification({ userId, type, status: 'db_failure', sentAt: timestamp, error: err.message });
    console.error('Prisma create notification error:', err);
    throw new ServerError('Failed to create notification');
  }

  try {
    await sendPushNotification(userId, { title, body, type });
  } catch (err) {
    await logNotification({ userId, type, status: 'push_failed', sentAt: timestamp, error: err.message });
  }

  if (sendSms) {
    try {
      await SnsService.sendSms({ toUserId: userId, message: body });
    } catch (err) {
      await logNotification({ userId, type, status: 'sms_failed', sentAt: timestamp, error: err.message });
    }
  }

  if (sendEmail) {
    try {
      await EmailService.sendNotificationEmail({ toUserId: userId, subject: title, body });
    } catch (err) {
      await logNotification({ userId, type, status: 'email_failed', sentAt: timestamp, error: err.message });
    }
  }

  await logNotification({ userId, type, status: 'success', sentAt: timestamp });

  return notification;
};

export const getUserNotifications = async (userId, filter) => {
  const where = {user_id: userId, is_deleted: false};

  if (filter === 'unread') where.is_read = false;

  const notifications = await prisma.notifications.findMany({ where, orderBy: { sent_at: 'desc'}})
  const unread_count = await prisma.notifications.count({
    where: { user_id: userId, is_deleted: false, is_read: false}
  });

  return {notifications, unread_count};
}

export const markAllAsRead = async (userId) => {
  const notifications = await prisma.notifications.updateMany({
    where: {
      user_id: userId,
      is_deleted: false,
      is_read: false
    }, 
    data: {
      is_read: true,
      read_at: new Date()
    },
  })

  return {notifications, unread_count: 0}; 
}

export const clearAllNotifications = async (userId) => {
  await prisma.notifications.updateMany({
    where: { user_id: userId, is_deleted: false},
    data: { is_deleted: true, deleted_at: new Date() }
  });
}

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
    orderBy: { sent_at: 'desc'}
  });

  const unread_count = await prisma.notifications.count({where: {user_id: userId, is_deleted: false, is_read: false}});

  return { notifications, unread_count};
}

export const markAsRead = async (userId, ids = null) => {
  const where = {
    user_id: userId,
    is_read: false,
    is_deleted: false,
    ...(ids ? { id: { in: ids } } : {})
  };

  const updated = await prisma.notifications.updateMany({
    where,
    data: { is_read: true, read_at: new Date() }
  });

  const unread_count = await prisma.notifications.count({
    where: { user_id: userId, is_deleted: false, is_read: false }
  });

  return { updated: updated.count, unread_count };
};


export const clearNotifications = async (userId, ids = null) => {
  const where = {
    user_id: userId,
    is_deleted: false,
    ...(ids ? { id: { in: ids } } : {})
  };

  const result = await prisma.notifications.updateMany({
    where,
    data: { is_deleted: true, deleted_at: new Date() }
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
    clearNotifications
}