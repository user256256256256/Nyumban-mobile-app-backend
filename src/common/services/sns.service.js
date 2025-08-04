// sns.service.js (Mock Implementation)
// Temporary simulation until AWS SDK integration is added.


import prisma from '../../prisma-client.js';
import { v4 as uuidv4 } from 'uuid';

// Simulated SNS Service
const sns = {
  createPlatformEndpoint: async ({ PlatformApplicationArn, Token }) => {
    console.log('[SNS MOCK] Creating platform endpoint:', { PlatformApplicationArn, Token });
    return { EndpointArn: `mock-endpoint-${uuidv4()}` };
  },

  publish: async ({ Message, MessageStructure, TargetArn }) => {
    console.log('[SNS MOCK] Publishing message:', { TargetArn, MessageStructure });
    console.log('Message content:', Message);
    return { MessageId: `mock-message-${uuidv4()}` };
  },
};

// Register a device token (mock SNS endpoint)
export const registerDeviceToken = async (userId, deviceToken, platformApplicationArn) => {
  const { EndpointArn } = await sns.createPlatformEndpoint({
    PlatformApplicationArn: platformApplicationArn,
    Token: deviceToken,
  });

  await prisma.device_tokens.upsert({
    where: { endpoint_arn: EndpointArn },
    update: {
      user_id: userId,
      device_token: deviceToken,
      updated_at: new Date(),
      is_active: true,
    },
    create: {
      id: uuidv4(),
      user_id: userId,
      device_token: deviceToken,
      endpoint_arn: EndpointArn,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
  });

  return EndpointArn;
};

// Get user endpoints
export const getUserEndpoints = async (userId) => {
  return prisma.device_tokens.findMany({
    where: { user_id: userId, is_active: true },
    select: { endpoint_arn: true },
  });
};

// Send push notification (mock)
export const sendRemotePush = async (endpointArn, payload) => {
  const message = {
    default: payload.body,
    APNS: JSON.stringify({
      aps: { alert: { title: payload.title, body: payload.body }, sound: 'default' },
      data: { type: payload.type || 'default' },
    }),
    GCM: JSON.stringify({
      notification: { title: payload.title, body: payload.body },
      data: { type: payload.type || 'default' },
    }),
  };

  await sns.publish({
    Message: JSON.stringify(message),
    MessageStructure: 'json',
    TargetArn: endpointArn,
  });
};

// Deactivate endpoint
export const deactivateEndpoint = async (endpointArn) => {
  await prisma.device_tokens.updateMany({
    where: { endpoint_arn: endpointArn },
    data: { is_active: false, updated_at: new Date() },
  });
};

// Send SMS (mock simulation)
export const sendSms = async ({ toUserId, message }) => {
  const user = await prisma.users.findUnique({ where: { id: toUserId } });
  if (!user?.phone_number) {
    console.warn(`[SNS MOCK] No phone number found for user ${toUserId}`);
    return { success: false };
  }

  console.log(`[SNS MOCK] Sending SMS to ${user.phone_number}`);
  console.log(`Message: ${message}`);
  return { success: true, delivered: true };
};
