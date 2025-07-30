import AWS from 'aws-sdk';
import prisma from '../../prisma-client.js';
import { v4 as uuidv4 } from 'uuid';

const sns = new AWS.SNS({ region: process.env.AWS_REGION });

export const registerDeviceToken = async (userId, deviceToken, platformApplicationArn) => {
  const { EndpointArn } = await sns.createPlatformEndpoint({
    PlatformApplicationArn: platformApplicationArn,
    Token: deviceToken,
  }).promise();

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

export const getUserEndpoints = async (userId) => {
  return prisma.device_tokens.findMany({
    where: { user_id: userId, is_active: true },
    select: { endpoint_arn: true },
  });
};

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
  }).promise();
};

export const deactivateEndpoint = async (endpointArn) => {
  await prisma.device_tokens.updateMany({
    where: { endpoint_arn: endpointArn },
    data: { is_active: false, updated_at: new Date() },
  });
};

export const sendSms = async ({ toUserId, message }) => {
  const user = await prisma.users.findUnique({ where: { id: toUserId } });
  if (!user?.phone_number) {
    console.warn(`[SNS SIMULATION] No phone number found for user ${toUserId}`);
    return { success: false };
  }

  console.log(`[SNS SIMULATION] Sending SMS to ${user.phone_number}`);
  console.log(`Message: ${message}`);
  return { success: true, delivered: true };
};
