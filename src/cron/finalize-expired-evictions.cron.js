import prisma from '../prisma-client.js';
import { finalizeEvictionAndTerminateAgreement } from '../modules/agreement-termination/evict.util.js';

export const finalizeExpiredEvictions = async () => {
  const now = new Date();

  console.log(`[DEBUG] Checking expired evictions at ${now.toISOString()}`);

  const expiredEvictions = await prisma.eviction_logs.findMany({
    where: {
      status: 'warning',
      grace_period_end: { lt: now },
    },
    include: {
      agreement: {
        include: {
          users_rental_agreements_tenant_idTousers: true, // tenant
          users_rental_agreements_owner_idTousers: true,  // landlord
          properties: true,                               // property
          property_units: true,                           // unit
        },
      },
    },
  });

  if (!expiredEvictions.length) {
    console.log(`[DEBUG] No expired evictions found`);
    return;
  }

  console.log(`[DEBUG] Found ${expiredEvictions.length} expired eviction(s)`);

  for (const eviction of expiredEvictions) {
    try {
      await finalizeEvictionAndTerminateAgreement({
        eviction,
        timestamp: now,
        isAuto: true,
      });

      console.log(`[SUCCESS] Auto-finalized eviction ID=${eviction.id}`);
    } catch (err) {
      console.error(`[ERROR] Failed to finalize eviction ID=${eviction.id}:`, err);
    }
  }

  console.log(
    `[${new Date().toISOString()}] ✅ Finished auto-finalizing evictions (${expiredEvictions.length})`
  );
};
