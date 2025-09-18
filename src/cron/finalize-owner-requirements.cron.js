import prisma from '../prisma-client.js';
import { finalizeRentalAgreementTermination } from '../modules/agreement-termination/terminate-helper.js';

export const finalizeExpiredOwnerRequirements = async () => {
  const now = new Date();

  console.log(`[DEBUG] Checking expired owner requirement terminations at ${now.toISOString()}`);

  const expiredLogs = await prisma.eviction_logs.findMany({
    where: {
      status: 'warning',
      reason: 'OWNER_REQUIREMENT',
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

  if (!expiredLogs.length) {
    console.log(`[DEBUG] No expired owner requirement terminations found`);
    return;
  }

  console.log(`[DEBUG] Found ${expiredLogs.length} expired owner requirement termination(s)`);

  for (const log of expiredLogs) {
    try {
      console.log(`[DEBUG] Finalizing owner requirement eviction log ID=${log.id} for agreement ID=${log.agreement_id}`);

      await finalizeRentalAgreementTermination({
        agreement: log.agreement,
        timestamp: now,
        notify: true,
      });

      // Mark eviction log as finalized
      await prisma.eviction_logs.update({
        where: { id: log.id },
        data: {
          status: 'evicted',
          updated_at: now,
        },
      });

      // Update termination_confirmed_at for agreement
      await prisma.rental_agreements.update({
        where: { id: log.agreement_id },
        data: {
          termination_confirmed_at: now,
          updated_at: now,
        },
      });

      console.log(`[SUCCESS] Auto-finalized owner requirement eviction log ID=${log.id}`);
    } catch (err) {
      console.error(`[ERROR] Failed to finalize owner requirement eviction log ID=${log.id}:`, err);
    }
  }

  console.log(`[${new Date().toISOString()}] ✅ Finished auto-finalizing owner requirement terminations (${expiredLogs.length})`);
};
