import { logNotification } from '../utils/notification.logger.util.js';
import { isUserActive } from './user.service.js';
import { getUserEndpoints, sendRemotePush, deactivateEndpoint } from './sns.service.js';

// ---------------------------------------------------------
// sendPushNotification
// ---------------------------------------------------------
// Decides whether to send an IN-APP notification or a REMOTE PUSH.
// - If user is currently active in the app: log as "in_app" and show instantly.
// - If inactive: get their registered device endpoints and send a push.
// Uses SNS mock in development, AWS SNS in production.
// ---------------------------------------------------------
export const sendPushNotification = async (userId, payload) => {
  const timestamp = new Date();

  try {
    // Check if user is active in the app right now
    const active = await isUserActive(userId);

    if (active) {
      // Simulate in-app delivery (no remote push)
      console.log(`[PUSH] User ${userId} app active, showing in-app notification`);
      console.log(`Title: ${payload.title}\nBody: ${payload.body}`);

      await logNotification({ userId, type: payload.type, status: 'in_app', sentAt: timestamp });
      return { delivered: true, method: 'in_app' };
    }

    // User not active -> try remote push
    const endpoints = await getUserEndpoints(userId);
    if (!endpoints.length) throw new Error('No active device endpoints');

    // Send push to each endpoint (device)
    for (const { endpoint_arn } of endpoints) {
      try {
        await sendRemotePush(endpoint_arn, payload);
      } catch (err) {
        // If AWS/SNS says endpoint is disabled, deactivate it in DB
        if (err.code === 'EndpointDisabled') {
          await deactivateEndpoint(endpoint_arn);
        }
        throw err;
      }
    }

    await logNotification({ userId, type: payload.type, status: 'push_sent', sentAt: timestamp });
    return { delivered: true, method: 'remote_push' };

  } catch (err) {
    // Log failure for tracking/debugging
    await logNotification({ userId, type: payload.type, status: 'push_failed', sentAt: timestamp, error: err.message });
    console.error(`[PUSH ERROR] Failed sending to ${userId}:`, err);
    return { delivered: false, error: err.message };
  }
};
