import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { sendPushNotification } from '../common/services/push.service.js';
import * as SnsService from '../common/services/sns.service.js';
import { EmailService } from '../common/services/email.service.js';
import { logNotification } from '../common/utils/notification.logger.util.js';

const connection = new Redis(process.env.REDIS_URL);

export const notificationWorker = new Worker('notifications', async (job) => {
  const { userId, type, title, body, sendSms, sendEmail } = job.data;
  const timestamp = new Date();

  try {
    await sendPushNotification(userId, { title, body, type });
  } catch (err) {
    await logNotification({ userId, type, status: 'push_failed', sentAt: timestamp, error: err.message });
    throw err;
  }

  if (sendSms) {
    try {
      await SnsService.sendSms({ toUserId: userId, message: body });
    } catch (err) {
      await logNotification({ userId, type, status: 'sms_failed', sentAt: timestamp, error: err.message });
      throw err;
    }
  }

  if (sendEmail) {
    try {
      await EmailService.sendNotificationEmail({ toUserId: userId, subject: title, body });
    } catch (err) {
      await logNotification({ userId, type, status: 'email_failed', sentAt: timestamp, error: err.message });
      throw err;
    }
  }

  await logNotification({ userId, type, status: 'success', sentAt: timestamp });
}, { connection });
