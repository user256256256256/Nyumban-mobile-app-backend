import prisma from '../../prisma-client.js';

export const SnsService = {
  async sendSms({ toUserId, message }) {
    const user = await prisma.users.findUnique({ where: { id: toUserId } });
    if (!user?.phone_number) {
      console.warn(`[SNS SIMULATION] No phone number found for user ${toUserId}`);
      return { success: false };
    }

    console.log(`[SNS SIMULATION] Sending SMS to ${user.phone_number}`);
    console.log(`Message: ${message}`);
    return { success: true, delivered: true };
  }
};
