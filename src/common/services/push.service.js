import { logNotification } from '../utils/notification.logger.util.js';
import { isUserActive } from './user.service.js';
import { getUserEndpoints, sendRemotePush, deactivateEndpoint } from './sns.service.js';

export const sendPushNotification = async (userId, payload) => {
  const timestamp = new Date();

  try {
    const active = await isUserActive(userId);

    if (active) {
      console.log(`[PUSH] User ${userId} app active, showing in-app notification`);
      console.log(`Title: ${payload.title}\nBody: ${payload.body}`);

      await logNotification({ userId, type: payload.type, status: 'in_app', sentAt: timestamp });
      return { delivered: true, method: 'in_app' };
    }

    const endpoints = await getUserEndpoints(userId);
    if (!endpoints.length) throw new Error('No active device endpoints');

    for (const { endpoint_arn } of endpoints) {
      try {
        await sendRemotePush(endpoint_arn, payload);
      } catch (err) {
        if (err.code === 'EndpointDisabled') {
          await deactivateEndpoint(endpoint_arn);
        }
        throw err;
      }
    }

    await logNotification({ userId, type: payload.type, status: 'push_sent', sentAt: timestamp });
    return { delivered: true, method: 'remote_push' };

  } catch (err) {
    await logNotification({ userId, type: payload.type, status: 'push_failed', sentAt: timestamp, error: err.message });
    console.error(`[PUSH ERROR] Failed sending to ${userId}:`, err);
    return { delivered: false, error: err.message };
  }
};
