import prisma from '../../prisma-client.js';

/**
 * Checks if a rental agreement has any unpaid rent.
 * 
What we track in rent_payments:

due_date → when rent was due.

status → pending, overdued, or partial means unpaid/insufficient.

payment_date & amount_paid → to verify if paid fully.

period_covered (string) → e.g. "2025-08" might indicate rent month.

Eviction condition:

Find the most recent unpaid rent (latest due_date).

Check if today ≥ 1 full month after that due_date.

If yes → tenant qualifies for eviction (non-payment).

If not yet → landlord cannot evict.
 *
 * @param {string} agreementId - The ID of the rental agreement.
 * @returns {Promise<boolean>} - Returns true if unpaid rent exists, false otherwise.
 */
/**
 * Checks if tenant has one full month of unpaid rent.
 *
 * @param {string} agreementId - The ID of the rental agreement.
 * @returns {Promise<{ eligible: boolean, unpaidPeriod?: string, dueDate?: Date }>}
 */
export const checkEvictionEligibilityForUnpaidRent = async (agreementId) => {
  // Get the most recent unpaid rent record
  const recentUnpaid = await prisma.rent_payments.findFirst({
    where: {
      rental_agreement_id: agreementId,
      status: { in: ['pending', 'overdued', 'partial'] },
      is_deleted: false,
    },
    orderBy: {
      due_date: 'desc',
    },
  });

  if (!recentUnpaid) {
    return { eligible: false }; // No unpaid rent at all
  }

  const now = new Date();
  const dueDate = recentUnpaid.due_date;
  if (!dueDate) {
    return { eligible: false }; // Safety check
  }

  // Check if at least 1 full month has passed
  const oneMonthLater = new Date(dueDate);
  oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

  if (now >= oneMonthLater) {
    return {
      eligible: true,
      unpaidPeriod: recentUnpaid.period_covered,
      dueDate,
    };
  }

  return { eligible: false, unpaidPeriod: recentUnpaid.period_covered, dueDate };
};

export default checkEvictionEligibilityForUnpaidRent;


