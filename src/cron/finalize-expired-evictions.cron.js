import prisma from '../prisma-client.js';
import EvictionService from '../modules/evict-tenant/evict-tenant.service.js';

export const finalizeExpiredEvictions = async () => {
  const expiredWarnings = await prisma.eviction_logs.findMany({
    where: {
      status: 'warning',
      gracePeriodEnd: { lte: new Date() },
    },
  });

  if (expiredWarnings.length === 0) {
    console.log(`[${new Date().toISOString()}] No expired eviction warnings found.`);
    return;
  }

  for (const log of expiredWarnings) {
    try {
      await EvictionService.finalizeEviction({
        landlordId: log.landlord_id,
        evictionLogId: log.id,
      });
      console.log(`[${new Date().toISOString()}] ✅ Eviction finalized for log ID: ${log.id}`);
    } catch (error) {
      console.error(`❌ Error finalizing eviction log ${log.id}:`, error);
    }
  }
};
