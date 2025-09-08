// src/cron/finalize-owner-requirements.cron.js
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
        include: { tenant: true, landlord: true, property: true, unit: true },
      },
    },
  });

  if (!expiredLogs.length) {
    console.log(`[DEBUG] No expired owner requirement terminations found`);
    return;
  }

  for (const log of expiredLogs) {
    try {
      await finalizeRentalAgreementTermination({
        agreement: log.agreement,
        timestamp: now,
        notify: true,
      });

      // mark eviction log as completed
      await prisma.eviction_logs.update({
        where: { id: log.id },
        data: {
          status: 'finalized',
          updated_at: now,
        },
      });

      // update termination_confirmed_at for agreement
      await prisma.rental_agreements.update({
        where: { id: log.agreement_id },
        data: {
          termination_confirmed_at: now,
          updated_at: now,
        },
      });

      console.log(`[SUCCESS] Auto-finalized owner requirement eviction log ID=${log.id}`);
    } catch (err) {
      console.error(`[ERROR] Failed to finalize eviction log ID=${log.id}:`, err);
    }
  }

  console.log(
    `[${new Date().toISOString()}] ✅ Finished auto-finalizing owner requirement terminations (${expiredLogs.length})`
  );
};

