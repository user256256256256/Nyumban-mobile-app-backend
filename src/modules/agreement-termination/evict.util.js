import prisma from '../../prisma-client.js';
import { finalizeRentalAgreementTermination } from './terminate-helper.js';
import checkEvictionEligibilityForUnpaidRent from './check-has-upaid-rent.helper.js';
import { ForbiddenError, ServerError } from '../../common/services/errors-builder.service.js';

export async function finalizeEvictionAndTerminateAgreement({ eviction, timestamp = new Date(), isAuto = false }) {

  const { agreement } = eviction;
  if (!agreement) {
    throw new ServerError(`Eviction ${eviction.id} has no associated agreement`);
  }

  // 🔄 Recheck eviction eligibility before finalizing
  const { eligible, unpaidPeriod, dueDate } = await checkEvictionEligibilityForUnpaidRent(agreement.id);

  if (!eligible) {
    throw new ForbiddenError(
      `Tenant is not eligible for eviction. Latest unpaid rent period (${unpaidPeriod || 'N/A'}) due on ${
        dueDate?.toDateString() || 'unknown'
      } has not passed one full month yet or was paid.`
    );
  }

  // 1️⃣ Mark eviction as finalized
  const updatedEviction = await prisma.eviction_logs.update({
    where: { id: eviction.id },
    data: { status: 'evicted', updated_at: timestamp },
  });

  // 2️⃣ Finalize agreement, free property/unit, cancel payments, notify
  await finalizeRentalAgreementTermination({ agreement, timestamp, notify: true });

  return updatedEviction;
}
