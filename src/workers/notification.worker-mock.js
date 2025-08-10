// notification.worker-mock.js
// -----------------------------------------
// A fake worker that runs the job immediately.
// Uses the real push/email/SMS services, so you
// still see how notifications flow end-to-end.
// -----------------------------------------

import { sendPushNotification } from '../common/services/push.service.js';
import * as SnsService from '../common/services/sns.service.js';
import { EmailService } from '../common/services/email.service.js';
import { logNotification } from '../common/utils/notification.logger.util.js';

export async function notificationJobHandler(job) {
  const { userId, type, title, body, sendSms, sendEmail } = job.data;
  const timestamp = new Date();

  console.log(`[WORKER MOCK] Executing job "${job.name}" for user ${userId}`);

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
  console.log(`[WORKER MOCK] Job "${job.name}" completed successfully`);
}

/*
Notification worker is a background process that listens for notification jobs in the Redis/BullMQ queue.

How it works in our case:

triggerNotification adds a job (user, type, title, body, etc.) to the queue.

The worker picks up the job from Redis.

It sends the in-app push, and optionally SMS or email.

It logs the result (success or failure) for tracking.

*/