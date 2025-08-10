// sns.service.js (Mock Implementation)
// -------------------------------------------------------
// This is a DEVELOPMENT MOCK for AWS SNS (Simple Notification Service).
// In production, these functions will call AWS SDK to create device endpoints,
// publish push notifications, and send SMS.
// In development, they simply log actions and store data in the local DB
// so you can see the full flow without connecting to AWS.
// -------------------------------------------------------

import prisma from '../../prisma-client.js';
import { v4 as uuidv4 } from 'uuid';

// -----------------------------------------
// Simulated SNS object with mocked methods
// -----------------------------------------
const sns = {
  // Simulate creation of a platform endpoint in AWS SNS.
  // Normally AWS SNS returns an EndpointArn that uniquely identifies a device.
  createPlatformEndpoint: async ({ PlatformApplicationArn, Token }) => {
    console.log('[SNS MOCK] Creating platform endpoint:', { PlatformApplicationArn, Token });
    // Return a fake ARN for the device
    return { EndpointArn: `mock-endpoint-${uuidv4()}` };
  },

  // Simulate publishing a push notification message to SNS.
  publish: async ({ Message, MessageStructure, TargetArn }) => {
    console.log('[SNS MOCK] Publishing message:', { TargetArn, MessageStructure });
    console.log('Message content:', Message);
    // Return a fake message ID like AWS would
    return { MessageId: `mock-message-${uuidv4()}` };
  },
};

// -----------------------------------------
// Register a device token for a user
// -----------------------------------------
// In real AWS SNS, this would create an endpoint in SNS tied to a device token.
// In dev, it creates a DB record so we can still simulate sending pushes.
export const registerDeviceToken = async (userId, deviceToken, platformApplicationArn) => {
  const { EndpointArn } = await sns.createPlatformEndpoint({
    PlatformApplicationArn: platformApplicationArn,
    Token: deviceToken,
  });

  // Store or update the device token in DB
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

// -----------------------------------------
// Retrieve all active push endpoints for a user
// -----------------------------------------
export const getUserEndpoints = async (userId) => {
  return prisma.device_tokens.findMany({
    where: { user_id: userId, is_active: true },
    select: { endpoint_arn: true },
  });
};

// -----------------------------------------
// Send push notification to a specific endpoint
// -----------------------------------------
// In production, SNS publishes to APNS (Apple) or GCM/FCM (Android).
// Here, we log the payload to simulate remote push delivery.
export const sendRemotePush = async (endpointArn, payload) => {
  const message = {
    default: payload.body, // Fallback text
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

// -----------------------------------------
// Deactivate an SNS endpoint (mocked)
// -----------------------------------------
// If SNS marks a device as disabled, we set it inactive in DB.
export const deactivateEndpoint = async (endpointArn) => {
  await prisma.device_tokens.updateMany({
    where: { endpoint_arn: endpointArn },
    data: { is_active: false, updated_at: new Date() },
  });
};

// -----------------------------------------
// Send SMS to a user (mocked)
// -----------------------------------------
// In dev, we just log the SMS message.
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
