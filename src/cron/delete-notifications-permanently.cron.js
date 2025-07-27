import prisma from '../prisma-client.js'

export const permanentlyDeleteOldNotifications = async () => {
  const THIRTY_DAYS_AGO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const deleted = await prisma.notifications.deleteMany({
    where: {
      is_deleted: true,
      deleted_at: {
        lt: THIRTY_DAYS_AGO
      }
    }
  });

  console.log(`[${new Date().toISOString()}] Deleted ${deleted.count} old notifications permanently.`);
};
