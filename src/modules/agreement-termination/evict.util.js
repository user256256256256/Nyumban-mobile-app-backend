import { finalizeRentalAgreementTermination } from './terminate-helper.js';

export async function finalizeEvictionAndTerminateAgreement({ eviction, timestamp = new Date(), isAuto = false }) {
  const { agreement } = eviction;
  if (!agreement) throw new Error(`Eviction ${eviction.id} has no associated agreement`);

  // 1️⃣ Mark eviction as finalized
  const updatedEviction = await prisma.eviction_logs.update({
    where: { id: eviction.id },
    data: { status: 'evicted', updated_at: timestamp },
  });

  // 2️⃣ Use helper to finalize agreement, free property/unit, cancel payments, notify
  await finalizeRentalAgreementTermination({ agreement, timestamp, notify: true });

  return updatedEviction;
}
