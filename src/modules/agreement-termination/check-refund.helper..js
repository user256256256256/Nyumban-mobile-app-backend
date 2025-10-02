import { ForbiddenError } from '../../common/services/errors-builder.service.js';

/**
 * Checks if refundable amounts still exist for an agreement.
 * Refundable amounts = security deposit (if held/partially_refunded) + advance rent (future completed payments).
 *
 * @param {Object} agreement - Rental agreement object with rent_payments + security_deposits included.
 * @param {Date} [now=new Date()] - Current timestamp reference.
 * @returns {void} - Throws ForbiddenError if refunds are still pending, otherwise returns silently.
 */
export const checkRefundsOrThrow = (agreement, now = new Date()) => {
  const refundMessages = [];

  // 1️⃣ Security Deposit Check
  if (agreement.security_deposit_record) {
    const deposit = agreement.security_deposit_record;
    if (['held'].includes(deposit.status)) {
      refundMessages.push(
        `security deposit: ${parseFloat(deposit.amount)} ${deposit.currency || ''}`
      );
    }
  }

  // 2️⃣ Advance Rent Check
  const advanceRentPayments =
    agreement.rent_payments?.filter(
      (p) => p.status === 'completed' && new Date(p.due_date) > now
    ) || [];

  if (advanceRentPayments.length > 0) {
    const totalAdvance = advanceRentPayments.reduce(
      (acc, p) => acc + parseFloat(p.due_amount || 0),
      0
    );
    refundMessages.push(`advance rent: ${totalAdvance}`);
  }

  // 3️⃣ Block termination if pending refunds exist
  if (refundMessages.length > 0) {
    throw new ForbiddenError(
      `Cannot finalize termination: refundable amounts still pending. Please clear ${refundMessages.join(' and ')} first.`
    );
  }
};
